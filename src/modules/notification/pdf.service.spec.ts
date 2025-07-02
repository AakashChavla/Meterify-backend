import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PdfService } from './pdf.service';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock puppeteer
jest.mock('puppeteer');
const mockPuppeteer = puppeteer as jest.Mocked<typeof puppeteer>;

// Mock fs
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('PdfService', () => {
  let service: PdfService;
  let configService: jest.Mocked<ConfigService>;
  let mockBrowser: any;
  let mockPage: any;

  beforeEach(async () => {
    mockPage = {
      setContent: jest.fn(),
      pdf: jest.fn(),
      close: jest.fn(),
    };

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
    };

    // Mock the launch function properly
    (mockPuppeteer.launch as jest.Mock) = jest.fn().mockResolvedValue(mockBrowser);

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PdfService>(PdfService);
    configService = module.get(ConfigService);

    // Configure mock config service
    configService.get.mockImplementation((key: string) => {
      const config = {
        PDF_STORAGE_PATH: './storage/invoices',
      };
      return config[key];
    });

    // Configure fs mocks
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.access.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateInvoicePdf', () => {
    it('should generate PDF successfully', async () => {
      const mockInvoiceData = {
        id: 'invoice-123',
        invoiceNumber: 'INV-001',
        amount: 10000, // 100.00 in paise
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        dueDate: new Date('2025-08-01'),
        createdAt: new Date('2025-07-01'),
        items: [
          {
            description: 'API Calls (10K)',
            quantity: 10,
            unitPrice: 1000,
            total: 10000,
          },
        ],
        subtotal: 10000,
        tax: 0,
        total: 10000,
      };

      const mockPdfBuffer = Buffer.from('mock-pdf-content');
      mockPage.pdf.mockResolvedValueOnce(mockPdfBuffer);

      const result = await service.generateInvoicePdf(mockInvoiceData);

      expect(mockPuppeteer.launch).toHaveBeenCalledWith({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.setContent).toHaveBeenCalledWith(
        expect.stringContaining('John Doe'),
      );
      expect(mockPage.pdf).toHaveBeenCalledWith({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });
      expect(mockPage.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();

      expect(result).toEqual({
        success: true,
        buffer: mockPdfBuffer,
        filename: 'invoice-INV-001.pdf',
      });
    });

    it('should handle PDF generation failure', async () => {
      const mockInvoiceData = {
        id: 'invoice-123',
        invoiceNumber: 'INV-001',
        amount: 10000,
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        dueDate: new Date('2025-08-01'),
        createdAt: new Date('2025-07-01'),
        items: [],
        subtotal: 10000,
        tax: 0,
        total: 10000,
      };

      mockPuppeteer.launch.mockRejectedValueOnce(new Error('Puppeteer error'));

      const result = await service.generateInvoicePdf(mockInvoiceData);

      expect(result).toEqual({
        success: false,
        error: 'Puppeteer error',
      });
    });
  });

  describe('saveInvoicePdf', () => {
    it('should save PDF to disk successfully', async () => {
      const mockInvoiceData = {
        id: 'invoice-123',
        invoiceNumber: 'INV-001',
        amount: 10000,
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        dueDate: new Date('2025-08-01'),
        createdAt: new Date('2025-07-01'),
        items: [],
        subtotal: 10000,
        tax: 0,
        total: 10000,
      };

      const mockPdfBuffer = Buffer.from('mock-pdf-content');
      mockPage.pdf.mockResolvedValueOnce(mockPdfBuffer);

      // Mock fs.access to throw error (directory doesn't exist) so mkdir gets called
      mockFs.access.mockRejectedValueOnce(new Error('Directory not found'));

      const result = await service.saveInvoicePdf(mockInvoiceData);

      expect(mockFs.mkdir).toHaveBeenCalledWith('./storage/invoices', { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('invoice-INV-001.pdf'),
        mockPdfBuffer,
      );

      expect(result).toEqual({
        success: true,
        filePath: expect.stringContaining('invoice-INV-001.pdf'),
        filename: 'invoice-INV-001.pdf',
      });
    });

    it('should handle file saving failure', async () => {
      const mockInvoiceData = {
        id: 'invoice-123',
        invoiceNumber: 'INV-001',
        amount: 10000,
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        dueDate: new Date('2025-08-01'),
        createdAt: new Date('2025-07-01'),
        items: [],
        subtotal: 10000,
        tax: 0,
        total: 10000,
      };

      mockFs.writeFile.mockRejectedValueOnce(new Error('File system error'));

      const result = await service.saveInvoicePdf(mockInvoiceData);

      expect(result).toEqual({
        success: false,
        error: 'File system error',
      });
    });
  });

  describe('ensureStorageDirectory', () => {
    it('should create storage directory if it does not exist', async () => {
      mockFs.access.mockRejectedValueOnce(new Error('Directory does not exist'));

      await service.ensureStorageDirectory();

      expect(mockFs.access).toHaveBeenCalledWith('./storage/invoices');
      expect(mockFs.mkdir).toHaveBeenCalledWith('./storage/invoices', { recursive: true });
    });

    it('should not create directory if it already exists', async () => {
      mockFs.access.mockResolvedValueOnce(undefined);

      await service.ensureStorageDirectory();

      expect(mockFs.access).toHaveBeenCalledWith('./storage/invoices');
      expect(mockFs.mkdir).not.toHaveBeenCalled();
    });
  });
});
