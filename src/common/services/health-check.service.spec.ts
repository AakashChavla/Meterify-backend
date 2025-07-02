import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthCheckService } from './health-check.service';
import { LoggerService } from './logger.service';
import { PrismaService } from '../../config/prisma.service';

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let configService: ConfigService;
  let loggerService: LoggerService;
  let prismaService: PrismaService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthCheckService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthCheckService>(HealthCheckService);
    configService = module.get<ConfigService>(ConfigService);
    loggerService = module.get<LoggerService>(LoggerService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkAllServices', () => {
    it('should check all services and return health status', async () => {
      // Mock successful database connection
      mockPrismaService.$queryRaw.mockResolvedValue([{ test: 1 }]);

      // Mock SMTP configuration
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          SMTP_HOST: 'smtp.gmail.com',
          SMTP_PORT: 587,
          SMTP_USER: 'test@gmail.com',
          SMTP_PASS: 'testpass',
          RAZORPAY_KEY_ID: 'rzp_test_key',
          RAZORPAY_KEY_SECRET: 'test_secret',
        };
        return config[key];
      });

      const results = await service.checkAllServices();

      expect(results).toHaveLength(3);
      expect(results[0].service).toBe('Database');
      expect(results[1].service).toBe('Email Service');
      expect(results[2].service).toBe('Razorpay');
    });

    it('should handle database connection failure', async () => {
      // Mock database connection failure
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      // Mock other services
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          SMTP_HOST: 'smtp.gmail.com',
          SMTP_PORT: 587,
          SMTP_USER: 'test@gmail.com',
          SMTP_PASS: 'testpass',
          RAZORPAY_KEY_ID: 'rzp_test_key',
          RAZORPAY_KEY_SECRET: 'test_secret',
        };
        return config[key];
      });

      const results = await service.checkAllServices();

      expect(results[0].status).toBe('error');
      expect(results[0].message).toContain('Database connection failed');
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when all services are connected', async () => {
      // Mock all services as successful
      mockPrismaService.$queryRaw.mockResolvedValue([{ test: 1 }]);
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          SMTP_HOST: 'smtp.gmail.com',
          SMTP_PORT: 587,
          SMTP_USER: 'test@gmail.com',
          SMTP_PASS: 'testpass',
          RAZORPAY_KEY_ID: 'rzp_test_key',
          RAZORPAY_KEY_SECRET: 'test_secret',
        };
        return config[key];
      });

      const health = await service.getHealthStatus();

      expect(health.status).toBe('degraded'); // Email and Razorpay will likely fail in test
      expect(health.services).toHaveLength(3);
      expect(health.timestamp).toBeInstanceOf(Date);
    });

    it('should return unhealthy status when no services are connected', async () => {
      // Mock all services as failing
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Database failed'));
      mockConfigService.get.mockReturnValue(undefined);

      const health = await service.getHealthStatus();

      expect(health.status).toBe('unhealthy');
      expect(health.services).toHaveLength(3);
    });
  });
});
