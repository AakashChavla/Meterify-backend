import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from './rate-limit.service';
import { PrismaService } from '../../config/prisma.service';
import { LoggerService } from '../../common/services/logger.service';

describe('RateLimitService', () => {
  let service: RateLimitService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    rateLimitTracker: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
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

    service = module.get<RateLimitService>(RateLimitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have checkRateLimit method', () => {
    expect(service.checkRateLimit).toBeDefined();
    expect(typeof service.checkRateLimit).toBe('function');
  });

  describe('checkRateLimit', () => {
    it('should call prisma to find user', async () => {
      const userId = 'test-user-id';
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        rateLimit: 100,
        rateLimitWindow: 3600,
        status: 'ACTIVE',
      });
      mockPrismaService.rateLimitTracker.findUnique.mockResolvedValue(null);
      mockPrismaService.rateLimitTracker.create.mockResolvedValue({
        userId,
        windowStart: new Date(),
        requestCount: 0,
      });

      await service.checkRateLimit(userId);
      
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          rateLimit: true,
          rateLimitWindow: true,
          status: true,
        },
      });
    });
  });
});
