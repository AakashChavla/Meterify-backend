import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';

describe('PrismaService', () => {
  let service: PrismaService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      switch (key) {
        case 'DATABASE_URL':
          return 'postgresql://test:test@localhost:5432/test';
        case 'NODE_ENV':
          return 'test';
        default:
          return defaultValue;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have onModuleInit method', () => {
    expect(service.onModuleInit).toBeDefined();
    expect(typeof service.onModuleInit).toBe('function');
  });

  it('should have onModuleDestroy method', () => {
    expect(service.onModuleDestroy).toBeDefined();
    expect(typeof service.onModuleDestroy).toBe('function');
  });

  it('should extend PrismaClient', () => {
    expect(service.$connect).toBeDefined();
    expect(service.$disconnect).toBeDefined();
    expect(typeof service.$connect).toBe('function');
    expect(typeof service.$disconnect).toBe('function');
  });

  describe('configuration', () => {
    it('should use config service to get database URL', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('DATABASE_URL');
    });

    it('should use config service to get node environment', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('NODE_ENV');
    });
  });

  describe('lifecycle methods', () => {
    it('should have proper lifecycle methods for NestJS module', () => {
      expect(service.onModuleInit).toBeDefined();
      expect(service.onModuleDestroy).toBeDefined();
    });
  });
});
