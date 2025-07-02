import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import Razorpay from 'razorpay';

// Mock Razorpay
jest.mock('razorpay');
const MockRazorpay = Razorpay as jest.MockedClass<typeof Razorpay>;

describe('PaymentService', () => {
  let service: PaymentService;
  let configService: jest.Mocked<ConfigService>;
  let mockRazorpayInstance: any;

  beforeEach(async () => {
    mockRazorpayInstance = {
      orders: {
        create: jest.fn(),
        fetch: jest.fn(),
      },
      payments: {
        fetch: jest.fn(),
        capture: jest.fn(),
      },
      webhooks: {
        validateWebhookSignature: jest.fn(),
      },
    };

    MockRazorpay.mockImplementation(() => mockRazorpayInstance);

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    configService = module.get(ConfigService);

    // Configure mock config service to return valid credentials
    configService.get.mockImplementation((key: string) => {
      const config = {
        RAZORPAY_KEY_ID: 'test_key_id',
        RAZORPAY_KEY_SECRET: 'test_key_secret',
        RAZORPAY_WEBHOOK_SECRET: 'test_webhook_secret',
      };
      return config[key];
    });

    // Manually set the razorpay instance to our mock (since constructor already ran)
    (service as any).razorpay = mockRazorpayInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    it('should create Razorpay order successfully', async () => {
      const orderData = {
        amount: 10000, // 100.00 in paise
        currency: 'INR',
        receipt: 'invoice-123',
        notes: {
          userId: 'user-123',
          invoiceId: 'invoice-123',
        },
      };

      const mockOrder = {
        id: 'order_123456',
        amount: 10000,
        currency: 'INR',
        receipt: 'invoice-123',
        status: 'created',
        created_at: 1625097600,
      };

      mockRazorpayInstance.orders.create.mockResolvedValueOnce(mockOrder);

      const result = await service.createOrder(orderData);

      expect(mockRazorpayInstance.orders.create).toHaveBeenCalledWith({
        amount: 10000,
        currency: 'INR',
        receipt: 'invoice-123',
        notes: {
          userId: 'user-123',
          invoiceId: 'invoice-123',
        },
      });

      expect(result).toEqual({
        success: true,
        order: mockOrder,
      });
    });

    it('should handle order creation failure', async () => {
      const orderData = {
        amount: 10000,
        currency: 'INR',
        receipt: 'invoice-123',
        notes: {
          userId: 'user-123',
          invoiceId: 'invoice-123',
        },
      };

      mockRazorpayInstance.orders.create.mockRejectedValueOnce(
        new Error('Razorpay API Error'),
      );

      const result = await service.createOrder(orderData);

      expect(result).toEqual({
        success: false,
        error: 'Razorpay API Error',
      });
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment successfully', async () => {
      const orderId = 'order_123456';
      const paymentId = 'pay_123456';
      
      // Generate valid signature using crypto
      const crypto = require('crypto');
      const body = `${orderId}|${paymentId}`;
      const validSignature = crypto
        .createHmac('sha256', 'test_key_secret')
        .update(body)
        .digest('hex');

      const paymentData = {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
      };

      const result = await service.verifyPayment(paymentData);

      expect(result).toEqual({
        success: true,
        verified: true,
      });
    });

    it('should handle invalid signature', async () => {
      const paymentData = {
        razorpay_order_id: 'order_123456',
        razorpay_payment_id: 'pay_123456',
        razorpay_signature: 'invalid_signature',
      };

      const result = await service.verifyPayment(paymentData);

      expect(result).toEqual({
        success: true,
        verified: false,
      });
    });

    it('should handle verification error when service fails', async () => {
      // Override the razorpay instance to null to simulate initialization error
      (service as any).razorpay = null;

      const paymentData = {
        razorpay_order_id: 'order_123456',
        razorpay_payment_id: 'pay_123456',
        razorpay_signature: 'signature',
      };

      const result = await service.verifyPayment(paymentData);

      expect(result).toEqual({
        success: false,
        error: 'Razorpay not initialized. Check configuration.',
      });

      // Restore the razorpay instance for other tests
      (service as any).razorpay = mockRazorpayInstance;
    });
  });

  describe('getPaymentDetails', () => {
    it('should fetch payment details successfully', async () => {
      const paymentId = 'pay_123456';
      const mockPayment = {
        id: 'pay_123456',
        amount: 10000,
        currency: 'INR',
        status: 'captured',
        order_id: 'order_123456',
        method: 'card',
        created_at: 1625097600,
      };

      mockRazorpayInstance.payments.fetch.mockResolvedValueOnce(mockPayment);

      const result = await service.getPaymentDetails(paymentId);

      expect(mockRazorpayInstance.payments.fetch).toHaveBeenCalledWith(paymentId);
      expect(result).toEqual({
        success: true,
        payment: mockPayment,
      });
    });

    it('should handle payment fetch failure', async () => {
      const paymentId = 'pay_123456';

      mockRazorpayInstance.payments.fetch.mockRejectedValueOnce(
        new Error('Payment not found'),
      );

      const result = await service.getPaymentDetails(paymentId);

      expect(result).toEqual({
        success: false,
        error: 'Payment not found',
      });
    });
  });

  describe('getOrderDetails', () => {
    it('should fetch order details successfully', async () => {
      const orderId = 'order_123456';
      const mockOrder = {
        id: 'order_123456',
        amount: 10000,
        currency: 'INR',
        status: 'paid',
        receipt: 'invoice-123',
        created_at: 1625097600,
      };

      mockRazorpayInstance.orders.fetch.mockResolvedValueOnce(mockOrder);

      const result = await service.getOrderDetails(orderId);

      expect(mockRazorpayInstance.orders.fetch).toHaveBeenCalledWith(orderId);
      expect(result).toEqual({
        success: true,
        order: mockOrder,
      });
    });

    it('should handle order fetch failure', async () => {
      const orderId = 'order_123456';

      mockRazorpayInstance.orders.fetch.mockRejectedValueOnce(
        new Error('Order not found'),
      );

      const result = await service.getOrderDetails(orderId);

      expect(result).toEqual({
        success: false,
        error: 'Order not found',
      });
    });
  });

  describe('processWebhook', () => {
    it('should process payment.captured webhook successfully', async () => {
      const webhookBody = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123456',
              amount: 10000,
              currency: 'INR',
              status: 'captured',
              order_id: 'order_123456',
            },
          },
        },
      };

      // Generate valid signature using crypto
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', 'test_webhook_secret')
        .update(JSON.stringify(webhookBody))
        .digest('hex');

      const result = await service.processWebhook(webhookBody, expectedSignature);

      expect(result).toEqual({
        success: true,
        event: 'payment.captured',
        paymentData: {
          id: 'pay_123456',
          amount: 10000,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_123456',
        },
      });
    });

    it('should handle invalid webhook signature', async () => {
      const webhookBody = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123456',
            },
          },
        },
      };

      const signature = 'invalid_signature';

      const result = await service.processWebhook(webhookBody, signature);

      expect(result).toEqual({
        success: false,
        error: 'Invalid webhook signature',
      });
    });

    it('should handle unsupported webhook events', async () => {
      const webhookBody = {
        event: 'unsupported.event',
        payload: {},
      };

      // Generate valid signature for unsupported event
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', 'test_webhook_secret')
        .update(JSON.stringify(webhookBody))
        .digest('hex');

      const result = await service.processWebhook(webhookBody, expectedSignature);

      expect(result).toEqual({
        success: true,
        event: 'unsupported.event',
        message: 'Event not processed',
      });
    });
  });
});
