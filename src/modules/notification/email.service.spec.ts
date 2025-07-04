import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');
const mockNodemailer = require('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let configService: jest.Mocked<ConfigService>;
  let mockTransporter: any;

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn().mockResolvedValue(true),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get(ConfigService);

    // Manually set the transporter after service initialization
    (service as any).transporter = mockTransporter;

    // Configure mock config service
    configService.get.mockImplementation((key: string) => {
      const config = {
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: 587,
        SMTP_USER: 'test@example.com',
        SMTP_PASS: 'test-password',
        EMAIL_FROM: 'Meterify <test@example.com>',
      };
      return config[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendInvoiceEmail', () => {
    it('should send invoice email successfully', async () => {
      const mockInvoice = {
        id: 'invoice-123',
        amount: 1000,
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        dueDate: new Date('2025-08-01'),
        invoiceNumber: 'INV-001',
        items: [
          {
            description: 'API Calls (1K)',
            quantity: 1,
            unitPrice: 1000,
            total: 1000,
          },
        ],
      };

      mockTransporter.sendMail.mockResolvedValueOnce({
        messageId: 'test-message-id',
        accepted: ['john@example.com'],
        rejected: [],
      });

      const result = await service.sendInvoiceEmail(mockInvoice);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'Meterify <test@example.com>',
        to: 'john@example.com',
        subject: 'Invoice INV-001 - ₹10.00',
        html: expect.stringContaining('John Doe'),
      });

      expect(result).toEqual({
        success: true,
        messageId: 'test-message-id',
      });
    });

    it('should handle email sending failure', async () => {
      const mockInvoice = {
        id: 'invoice-123',
        amount: 1000,
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        dueDate: new Date('2025-08-01'),
        invoiceNumber: 'INV-001',
        items: [],
      };

      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      const result = await service.sendInvoiceEmail(mockInvoice);

      expect(result).toEqual({
        success: false,
        error: 'SMTP Error',
      });
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        apiKey: 'mk_test_123456',
      };

      mockTransporter.sendMail.mockResolvedValueOnce({
        messageId: 'welcome-message-id',
        accepted: ['john@example.com'],
        rejected: [],
      });

      const result = await service.sendWelcomeEmail(userData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'Meterify <test@example.com>',
        to: 'john@example.com',
        subject: 'Welcome to Meterify! 🚀',
        html: expect.stringContaining('John Doe'),
      });

      expect(result).toEqual({
        success: true,
        messageId: 'welcome-message-id',
      });
    });
  });

  describe('sendPaymentConfirmationEmail', () => {
    it('should send payment confirmation email successfully', async () => {
      const paymentData = {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        invoice: {
          invoiceNumber: 'INV-001',
          amount: 1000,
        },
        paymentId: 'pay_123456',
        paidAt: new Date(),
      };

      mockTransporter.sendMail.mockResolvedValueOnce({
        messageId: 'payment-message-id',
        accepted: ['john@example.com'],
        rejected: [],
      });

      const result = await service.sendPaymentConfirmationEmail(paymentData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'Meterify <test@example.com>',
        to: 'john@example.com',
        subject: 'Payment Confirmed - Invoice INV-001',
        html: expect.stringContaining('John Doe'),
      });

      expect(result).toEqual({
        success: true,
        messageId: 'payment-message-id',
      });
    });
  });

  describe('verifyConnection', () => {
    it('should verify SMTP connection successfully', async () => {
      mockTransporter.verify.mockResolvedValueOnce(true);

      const result = await service.verifyConnection();

      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle connection verification failure', async () => {
      mockTransporter.verify.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await service.verifyConnection();

      expect(result).toBe(false);
    });
  });
});
