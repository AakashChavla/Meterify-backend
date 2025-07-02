import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have getHello method', () => {
    expect(service.getHello).toBeDefined();
    expect(typeof service.getHello).toBe('function');
  });

  it('should have getHealth method', () => {
    expect(service.getHealth).toBeDefined();
    expect(typeof service.getHealth).toBe('function');
  });

  describe('getHello', () => {
    it('should return welcome message object', () => {
      const result = service.getHello();
      
      expect(result).toEqual({
        message: 'Welcome to Meterify API',
        version: '2.0.0',
        description: 'API Usage Tracking, Rate Limiting, Billing Automation with Payment Integration & Notifications',
        status: 'active',
        timestamp: expect.any(String),
        features: {
          phase1: ['User Management', 'Usage Tracking', 'Rate Limiting', 'Billing System', 'Admin Dashboard'],
          phase2: ['Payment Integration (Razorpay)', 'Email Notifications', 'PDF Generation', 'Health Monitoring'],
          phase3: 'Coming Soon - Advanced Analytics & Enterprise Features'
        },
      });
    });

    it('should return an object with timestamp', () => {
      const result = service.getHello();
      
      expect(result).toHaveProperty('timestamp');
      expect(typeof (result as any).timestamp).toBe('string');
      // Check if timestamp is a valid ISO string
      expect(new Date((result as any).timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('getHealth', () => {
    it('should return health status object', () => {
      const result = service.getHealth();
      
      expect(result).toEqual({
        status: 'ok',
        uptime: expect.any(Number),
        timestamp: expect.any(String),
        version: '2.0.0',
        environment: expect.any(String),
        memory: {
          used: expect.any(Number),
          total: expect.any(Number),
        },
      });
    });

    it('should return positive uptime', () => {
      const result = service.getHealth();
      
      expect((result as any).uptime).toBeGreaterThanOrEqual(0);
      expect(typeof (result as any).uptime).toBe('number');
    });
  });
});
