import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../../config/prisma.service';
import { LoggerService } from '../../common/services/logger.service';
import { ConfigService } from '@nestjs/config';

describe('BillingService', () => {
  let service: BillingService;

  const mockPrismaService = {
    monthlyUsageSummary: {
      findMany: jest.fn(),
    },
    billingInvoice: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have generateMonthlyInvoices method', () => {
    expect(service.generateMonthlyInvoices).toBeDefined();
    expect(typeof service.generateMonthlyInvoices).toBe('function');
  });

  describe('generateMonthlyInvoices', () => {
    it('should call prisma to find usage summaries', async () => {
      mockPrismaService.monthlyUsageSummary.findMany.mockResolvedValue([]);
      
      await service.generateMonthlyInvoices();
      
      expect(mockPrismaService.monthlyUsageSummary.findMany).toHaveBeenCalled();
      expect(mockLoggerService.log).toHaveBeenCalled();
    });
  });
});
