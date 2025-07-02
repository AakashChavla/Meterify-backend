import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';
import { ConfigService } from '@nestjs/config';

describe('LoggerService', () => {
  let service: LoggerService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('info'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have log method', () => {
    expect(service.log).toBeDefined();
    expect(typeof service.log).toBe('function');
  });

  it('should have error method', () => {
    expect(service.error).toBeDefined();
    expect(typeof service.error).toBe('function');
  });

  it('should have warn method', () => {
    expect(service.warn).toBeDefined();
    expect(typeof service.warn).toBe('function');
  });

  it('should have debug method', () => {
    expect(service.debug).toBeDefined();
    expect(typeof service.debug).toBe('function');
  });

  it('should have verbose method', () => {
    expect(service.verbose).toBeDefined();
    expect(typeof service.verbose).toBe('function');
  });

  describe('initialization', () => {
    it('should use config service to get log level', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('LOG_LEVEL', 'info');
    });
  });

  describe('logging methods', () => {
    it('should be able to call log method without throwing', () => {
      expect(() => service.log('Test message')).not.toThrow();
    });

    it('should be able to call error method without throwing', () => {
      expect(() => service.error('Test error')).not.toThrow();
    });

    it('should be able to call warn method without throwing', () => {
      expect(() => service.warn('Test warning')).not.toThrow();
    });
  });
});
