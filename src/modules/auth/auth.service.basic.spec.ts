import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../config/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService - Basic Tests', () => {
  let service: AuthService;

  const mockPrismaService = {
    adminUser: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have validateAdmin method', () => {
    expect(typeof service.validateAdmin).toBe('function');
  });

  it('should have loginAdmin method', () => {
    expect(typeof service.loginAdmin).toBe('function');
  });

  it('should have registerAdmin method', () => {
    expect(typeof service.registerAdmin).toBe('function');
  });

  it('should have generateApiKey method', () => {
    expect(typeof service.generateApiKey).toBe('function');
  });

  it('should generate API key with correct prefix', () => {
    const apiKey = service.generateApiKey();
    expect(apiKey).toMatch(/^mk_/);
    expect(apiKey.length).toBeGreaterThan(10);
  });
});
