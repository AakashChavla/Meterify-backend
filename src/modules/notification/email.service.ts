import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface InvoiceData {
  id: string;
  amount: number;
  user: {
    name: string;
    email: string;
  };
  dueDate: Date;
  invoiceNumber: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface WelcomeData {
  name: string;
  email: string;
  apiKey: string;
}

interface PaymentData {
  user: {
    name: string;
    email: string;
  };
  invoice: {
    invoiceNumber: string;
    amount: number;
  };
  paymentId: string;
  paidAt: Date;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port: this.configService.get<number>('SMTP_PORT'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });

      // Test connection
      if (this.transporter && this.transporter.verify) {
        this.transporter.verify()
          .then(() => {
            this.logger.log('✅ Email service initialized successfully');
          })
          .catch((error) => {
            this.logger.error(`❌ Email service initialization failed: ${error.message}`);
          });
      }
    } catch (error) {
      this.logger.error(`❌ Failed to create email transporter: ${error.message}`);
    }
  }

  async sendInvoiceEmail(invoiceData: InvoiceData): Promise<EmailResult> {
    try {
      const template = this.getInvoiceTemplate();
      const html = template({
        ...invoiceData,
        formattedAmount: this.formatCurrency(invoiceData.amount),
        formattedDueDate: invoiceData.dueDate.toLocaleDateString('en-IN'),
        currentYear: new Date().getFullYear(),
      });

      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM'),
        to: invoiceData.user.email,
        subject: `Invoice ${invoiceData.invoiceNumber} - ${this.formatCurrency(invoiceData.amount)}`,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Invoice email sent successfully to ${invoiceData.user.email}`);
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send invoice email: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendWelcomeEmail(userData: WelcomeData): Promise<EmailResult> {
    try {
      const template = this.getWelcomeTemplate();
      const html = template({
        ...userData,
        currentYear: new Date().getFullYear(),
      });

      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM'),
        to: userData.email,
        subject: 'Welcome to Meterify! 🚀',
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Welcome email sent successfully to ${userData.email}`);
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send welcome email: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendPaymentConfirmationEmail(paymentData: PaymentData): Promise<EmailResult> {
    try {
      const template = this.getPaymentConfirmationTemplate();
      const html = template({
        ...paymentData,
        formattedAmount: this.formatCurrency(paymentData.invoice.amount),
        formattedDate: paymentData.paidAt.toLocaleDateString('en-IN'),
        currentYear: new Date().getFullYear(),
      });

      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM'),
        to: paymentData.user.email,
        subject: `Payment Confirmed - Invoice ${paymentData.invoice.invoiceNumber}`,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Payment confirmation email sent successfully to ${paymentData.user.email}`);
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send payment confirmation email: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error(`SMTP connection failed: ${error.message}`);
      return false;
    }
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount / 100);
  }

  private getInvoiceTemplate(): HandlebarsTemplateDelegate {
    const template = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice {{invoiceNumber}}</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .invoice-details { background-color: #f8fafc; padding: 25px; border-radius: 10px; margin: 20px 0; }
            .invoice-details h3 { margin: 0 0 15px 0; color: #4a5568; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .detail-label { color: #718096; }
            .detail-value { font-weight: 600; color: #2d3748; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            .items-table th { background-color: #f7fafc; font-weight: 600; color: #4a5568; }
            .total-row { background-color: #f8fafc; font-weight: 600; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f8fafc; padding: 30px; text-align: center; color: #718096; border-top: 1px solid #e2e8f0; }
            .footer p { margin: 5px 0; }
            @media (max-width: 600px) {
                .container { width: 100%; }
                .content { padding: 20px; }
                .invoice-details { padding: 15px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Meterify</h1>
                <p>API Usage Tracking & Billing</p>
            </div>
            
            <div class="content">
                <h2>Hi {{user.name}},</h2>
                <p>Your invoice is ready! Here are the details of your API usage for this billing period.</p>
                
                <div class="invoice-details">
                    <h3>Invoice Details</h3>
                    <div class="detail-row">
                        <span class="detail-label">Invoice Number:</span>
                        <span class="detail-value">{{invoiceNumber}}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Amount:</span>
                        <span class="detail-value">{{formattedAmount}}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Due Date:</span>
                        <span class="detail-value">{{formattedDueDate}}</span>
                    </div>
                </div>

                {{#if items.length}}
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{#each items}}
                        <tr>
                            <td>{{description}}</td>
                            <td>{{quantity}}</td>
                            <td>₹{{unitPrice}}</td>
                            <td>₹{{total}}</td>
                        </tr>
                        {{/each}}
                        <tr class="total-row">
                            <td colspan="3"><strong>Total Amount</strong></td>
                            <td><strong>{{../formattedAmount}}</strong></td>
                        </tr>
                    </tbody>
                </table>
                {{/if}}

                <a href="#" class="cta-button">Pay Now</a>
                
                <p>If you have any questions about this invoice, please don't hesitate to contact our support team.</p>
                
                <p>Best regards,<br>The Meterify Team</p>
            </div>
            
            <div class="footer">
                <p><strong>Meterify</strong> - API Usage Tracking & Billing</p>
                <p>© {{currentYear}} Meterify. All rights reserved.</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
    return handlebars.compile(template);
  }

  private getWelcomeTemplate(): HandlebarsTemplateDelegate {
    const template = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Meterify</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 50px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 32px; font-weight: 600; }
            .header p { margin: 15px 0 0 0; opacity: 0.9; font-size: 18px; }
            .content { padding: 40px 30px; }
            .welcome-message { text-align: center; margin: 30px 0; }
            .welcome-message h2 { color: #10b981; font-size: 24px; margin-bottom: 15px; }
            .api-key-section { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #0ea5e9; }
            .api-key-section h3 { margin: 0 0 15px 0; color: #0c4a6e; }
            .api-key { font-family: 'Courier New', monospace; background-color: #1e293b; color: #f1f5f9; padding: 15px; border-radius: 8px; word-break: break-all; font-size: 14px; }
            .features { margin: 30px 0; }
            .feature-item { display: flex; align-items: flex-start; margin: 15px 0; }
            .feature-icon { background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 14px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f8fafc; padding: 30px; text-align: center; color: #718096; border-top: 1px solid #e2e8f0; }
            .footer p { margin: 5px 0; }
            @media (max-width: 600px) {
                .container { width: 100%; }
                .content { padding: 20px; }
                .api-key-section { padding: 15px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 Welcome to Meterify!</h1>
                <p>Your API tracking journey starts here</p>
            </div>
            
            <div class="content">
                <div class="welcome-message">
                    <h2>Hello {{name}}! 👋</h2>
                    <p>Welcome to Meterify! We're excited to have you on board. Your account has been set up successfully and you're ready to start tracking your API usage.</p>
                </div>
                
                <div class="api-key-section">
                    <h3>🔑 Your API Key</h3>
                    <p>Here's your unique API key. Keep it secure and use it to authenticate your API calls:</p>
                    <div class="api-key">{{apiKey}}</div>
                    <p style="margin-top: 15px; font-size: 14px; color: #64748b;">
                        <strong>Important:</strong> Store this key securely. You'll need it for all API requests.
                    </p>
                </div>

                <div class="features">
                    <h3>What you can do with Meterify:</h3>
                    <div class="feature-item">
                        <div class="feature-icon">📊</div>
                        <div>
                            <strong>Real-time Usage Tracking</strong><br>
                            Monitor your API calls, response times, and performance metrics in real-time.
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">🚦</div>
                        <div>
                            <strong>Smart Rate Limiting</strong><br>
                            Automatic rate limiting based on your subscription tier to ensure optimal performance.
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">💰</div>
                        <div>
                            <strong>Automated Billing</strong><br>
                            Get detailed invoices and usage reports delivered automatically each month.
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">📈</div>
                        <div>
                            <strong>Advanced Analytics</strong><br>
                            Detailed insights into your API usage patterns and performance trends.
                        </div>
                    </div>
                </div>

                <div style="text-align: center;">
                    <a href="http://localhost:3000/docs" class="cta-button">View API Documentation</a>
                </div>
                
                <p>If you have any questions or need help getting started, our support team is here to help!</p>
                
                <p>Happy coding!<br>The Meterify Team</p>
            </div>
            
            <div class="footer">
                <p><strong>Meterify</strong> - API Usage Tracking & Billing</p>
                <p>© {{currentYear}} Meterify. All rights reserved.</p>
                <p>Need help? Contact us at support@meterify.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
    return handlebars.compile(template);
  }

  private getPaymentConfirmationTemplate(): HandlebarsTemplateDelegate {
    const template = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmed</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .success-message { text-align: center; margin: 30px 0; }
            .success-icon { background-color: #10b981; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 24px; }
            .payment-details { background-color: #f0f9ff; padding: 25px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
            .payment-details h3 { margin: 0 0 15px 0; color: #0c4a6e; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .detail-label { color: #718096; }
            .detail-value { font-weight: 600; color: #2d3748; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f8fafc; padding: 30px; text-align: center; color: #718096; border-top: 1px solid #e2e8f0; }
            .footer p { margin: 5px 0; }
            @media (max-width: 600px) {
                .container { width: 100%; }
                .content { padding: 20px; }
                .payment-details { padding: 15px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Payment Confirmed!</h1>
                <p>Thank you for your payment</p>
            </div>
            
            <div class="content">
                <div class="success-message">
                    <div class="success-icon">✓</div>
                    <h2>Payment Successful!</h2>
                    <p>Hi {{user.name}}, your payment has been processed successfully.</p>
                </div>
                
                <div class="payment-details">
                    <h3>Payment Details</h3>
                    <div class="detail-row">
                        <span class="detail-label">Invoice Number:</span>
                        <span class="detail-value">{{invoice.invoiceNumber}}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Amount Paid:</span>
                        <span class="detail-value">{{formattedAmount}}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Payment ID:</span>
                        <span class="detail-value">{{paymentId}}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Payment Date:</span>
                        <span class="detail-value">{{formattedDate}}</span>
                    </div>
                </div>

                <p>Your account has been updated and your API access will continue uninterrupted. You can continue using Meterify's services without any limitations.</p>

                <div style="text-align: center;">
                    <a href="http://localhost:3000/docs" class="cta-button">Access Your Dashboard</a>
                </div>
                
                <p>If you have any questions about this payment or need assistance, please don't hesitate to contact our support team.</p>
                
                <p>Thank you for choosing Meterify!<br>The Meterify Team</p>
            </div>
            
            <div class="footer">
                <p><strong>Meterify</strong> - API Usage Tracking & Billing</p>
                <p>© {{currentYear}} Meterify. All rights reserved.</p>
                <p>Need help? Contact us at support@meterify.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
    return handlebars.compile(template);
  }
}
