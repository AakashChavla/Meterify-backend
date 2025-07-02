import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../../config/prisma.service';

describe('AdminService', () => {
  let service: AdminService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    apiUsageLog: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    apiEndpoint: {
      findMany: jest.fn(),
    },
    billingInvoice: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    monthlyUsageSummary: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have getDashboardOverview method', () => {
    expect(service.getDashboardOverview).toBeDefined();
    expect(typeof service.getDashboardOverview).toBe('function');
  });

  describe('getDashboardOverview', () => {
    it('should call prisma methods to get dashboard data', async () => {
      // Mock all the Promise.all calls
      mockPrismaService.user.count.mockResolvedValue(10);
      mockPrismaService.apiUsageLog.count.mockResolvedValue(1000);
      mockPrismaService.billingInvoice.aggregate.mockResolvedValue({ _sum: { billAmount: 5000 } });
      mockPrismaService.billingInvoice.count.mockResolvedValue(5);
      mockPrismaService.apiUsageLog.groupBy.mockResolvedValue([]);
      mockPrismaService.apiEndpoint.findMany.mockResolvedValue([]);

      await service.getDashboardOverview();
      
      expect(mockPrismaService.user.count).toHaveBeenCalled();
      expect(mockPrismaService.apiUsageLog.count).toHaveBeenCalled();
      expect(mockPrismaService.billingInvoice.aggregate).toHaveBeenCalled();
      expect(mockPrismaService.billingInvoice.count).toHaveBeenCalled();
    });
  });
});
