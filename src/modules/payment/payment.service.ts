import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

export interface PaymentResult {
  success: boolean;
  order?: any;
  payment?: any;
  error?: string;
  verified?: boolean;
  event?: string;
  paymentData?: any;
  message?: string;
}

export interface OrderData {
  amount: number;
  currency: string;
  receipt: string;
  notes?: {
    userId?: string;
    invoiceId?: string;
    [key: string]: any;
  };
}

export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private razorpay: Razorpay;

  constructor(private configService: ConfigService) {
    this.initializeRazorpay();
  }

  private initializeRazorpay() {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      this.logger.warn('❌ Razorpay credentials not configured. Payment functionality will be limited.');
      return;
    }

    if (keyId === 'rzp_test_your_key_id' || keySecret === 'your_razorpay_secret_key') {
      this.logger.warn('⚠️ Razorpay using default test credentials. Please update with real credentials.');
    }

    try {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      // Test connection
      this.testConnection()
        .then((isConnected) => {
          if (isConnected) {
            this.logger.log('✅ Razorpay connection test successful');
          } else {
            this.logger.error('❌ Razorpay connection test failed');
          }
        })
        .catch((error) => {
          this.logger.error(`❌ Razorpay connection test error: ${error.message}`);
        });
      
      this.logger.log('✅ Razorpay initialized successfully');
    } catch (error) {
      this.logger.error(`❌ Failed to initialize Razorpay: ${error.message}`);
    }
  }

  async createOrder(orderData: OrderData): Promise<PaymentResult> {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay not initialized. Check configuration.');
      }

      const order = await this.razorpay.orders.create({
        amount: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
        notes: orderData.notes || {},
      });

      this.logger.log(`Order created successfully: ${order.id}`);

      return {
        success: true,
        order,
      };
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyPayment(paymentData: PaymentVerificationData): Promise<PaymentResult> {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay not initialized. Check configuration.');
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

      // Generate expected signature
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.configService.get<string>('RAZORPAY_KEY_SECRET'))
        .update(body)
        .digest('hex');

      const isVerified = expectedSignature === razorpay_signature;

      if (isVerified) {
        this.logger.log(`Payment verified successfully: ${razorpay_payment_id}`);
      } else {
        this.logger.warn(`Payment verification failed: ${razorpay_payment_id}`);
      }

      return {
        success: true,
        verified: isVerified,
      };
    } catch (error) {
      this.logger.error(`Payment verification error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getPaymentDetails(paymentId: string): Promise<PaymentResult> {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay not initialized. Check configuration.');
      }

      const payment = await this.razorpay.payments.fetch(paymentId);

      this.logger.log(`Payment details fetched: ${paymentId}`);

      return {
        success: true,
        payment,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch payment details: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getOrderDetails(orderId: string): Promise<PaymentResult> {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay not initialized. Check configuration.');
      }

      const order = await this.razorpay.orders.fetch(orderId);

      this.logger.log(`Order details fetched: ${orderId}`);

      return {
        success: true,
        order,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch order details: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async processWebhook(body: any, signature: string): Promise<PaymentResult> {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay not initialized. Check configuration.');
      }

      const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
      
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      if (expectedSignature !== signature) {
        this.logger.warn('Invalid webhook signature received');
        return {
          success: false,
          error: 'Invalid webhook signature',
        };
      }

      const { event, payload } = body;

      this.logger.log(`Processing webhook event: ${event}`);

      // Process different webhook events
      switch (event) {
        case 'payment.captured':
          return {
            success: true,
            event,
            paymentData: payload.payment.entity,
          };

        case 'payment.failed':
          return {
            success: true,
            event,
            paymentData: payload.payment.entity,
          };

        case 'order.paid':
          return {
            success: true,
            event,
            paymentData: payload.order.entity,
          };

        default:
          this.logger.log(`Unhandled webhook event: ${event}`);
          return {
            success: true,
            event,
            message: 'Event not processed',
          };
      }
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async capturePayment(paymentId: string, amount: number): Promise<PaymentResult> {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay not initialized. Check configuration.');
      }

      const payment = await this.razorpay.payments.capture(paymentId, amount, 'INR');

      this.logger.log(`Payment captured successfully: ${paymentId}`);

      return {
        success: true,
        payment,
      };
    } catch (error) {
      this.logger.error(`Failed to capture payment: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Utility method to format amount for Razorpay (convert to paise)
  formatAmountForRazorpay(amount: number): number {
    // If amount is already in paise, return as is
    // If amount is in rupees, convert to paise
    return Math.round(amount * 100);
  }

  // Utility method to format amount from Razorpay (convert from paise)
  formatAmountFromRazorpay(amount: number): number {
    return amount / 100;
  }

  // Generate payment link (for future use)
  generatePaymentUrl(orderId: string): string {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    return `https://checkout.razorpay.com/v1/checkout.js?key_id=${keyId}&order_id=${orderId}`;
  }

  // Test connection to Razorpay
  async testConnection(): Promise<boolean> {
    try {
      if (!this.razorpay) {
        return false;
      }

      // Try to fetch a non-existent order to test API connectivity
      await this.razorpay.orders.fetch('test_order_id');
      return true;
    } catch (error) {
      // If we get a specific Razorpay error (not network error), connection is working
      if (error.message.includes('The id provided does not exist')) {
        return true;
      }
      this.logger.error(`Razorpay connection test failed: ${error.message}`);
      return false;
    }
  }
}
