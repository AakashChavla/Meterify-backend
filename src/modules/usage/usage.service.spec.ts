import { Test, TestingModule } from '@nestjs/testing';
import { UsageService } from './usage.service';
import { PrismaService } from '../../config/prisma.service';
import { LoggerService } from '../../common/services/logger.service';

describe('UsageService', () => {
  let service: UsageService;

  const mockPrismaService = {
    apiUsageLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    monthlyUsageSummary: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    apiEndpoint: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    logApiUsage: jest.fn(),
    logRateLimit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<UsageService>(UsageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have logApiUsage method', () => {
    expect(typeof service.logApiUsage).toBe('function');
  });

  it('should have getUserUsageSummary method', () => {
    expect(typeof service.getUserUsageSummary).toBe('function');
  });

  it('should have getUserUsageLogs method', () => {
    expect(typeof service.getUserUsageLogs).toBe('function');
  });

  it('should have getEndpointAnalytics method', () => {
    expect(typeof service.getEndpointAnalytics).toBe('function');
  });

  it('should have getSystemAnalytics method', () => {
    expect(typeof service.getSystemAnalytics).toBe('function');
  });

  describe('logApiUsage', () => {
    it('should log API usage successfully', async () => {
      const logDto = {
        userId: 'user-1',
        endpoint: '/api/v1/test',
        method: 'GET' as any,
        statusCode: 200,
        responseTime: 150,
      };

      const mockEndpoint = {
        id: 'endpoint-1',
        path: logDto.endpoint,
        method: logDto.method,
      };

      const mockUsageLog = {
        id: 'log-1',
        userId: logDto.userId,
        endpointId: mockEndpoint.id,
        statusCode: logDto.statusCode,
        responseTimeMs: logDto.responseTime,
        timestamp: new Date(),
      };

      mockPrismaService.apiEndpoint.findFirst.mockResolvedValue(mockEndpoint);
      mockPrismaService.apiUsageLog.create.mockResolvedValue(mockUsageLog);
      mockPrismaService.monthlyUsageSummary.findUnique.mockResolvedValue(null);
      mockPrismaService.monthlyUsageSummary.upsert.mockResolvedValue({});

      const result = await service.logApiUsage(logDto);

      expect(result).toEqual({
        id: 'log-1',
        timestamp: expect.any(Date),
        message: 'Usage logged successfully',
      });
      expect(mockPrismaService.apiUsageLog.create).toHaveBeenCalled();
    });
  });

  describe('getUserUsageSummary', () => {
    it('should return user usage summary', async () => {
      const userId = 'user-1';
      const monthYear = '2024-07';

      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        status: 'ACTIVE',
      };

      const mockSummary = {
        id: 'summary-1',
        userId,
        monthYear,
        totalCalls: 1500,
        uniqueEndpoints: 5,
        avgResponseTime: 120,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.monthlyUsageSummary.findUnique.mockResolvedValue(mockSummary);

      const result = await service.getUserUsageSummary(userId, monthYear);

      expect(result).toEqual({
        userId: 'user-1',
        monthYear: '2024-07',
        summary: {
          id: 'summary-1',
          userId: 'user-1',
          monthYear: '2024-07',
          totalCalls: 1500,
          uniqueEndpoints: 5,
          avgResponseTime: 120,
        },
      });
    });
  });
});
