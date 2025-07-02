import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../config/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

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
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAdmin', () => {
    it('should return admin user when credentials are valid', async () => {
      const email = 'admin@test.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const mockAdmin = {
        id: '1',
        email,
        password: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
        isActive: true,
      };

      mockPrismaService.adminUser.findUnique.mockResolvedValue(mockAdmin);

      const result = await service.validateAdmin(email, password);

      expect(result).toEqual({
        id: mockAdmin.id,
        email: mockAdmin.email,
        name: mockAdmin.name,
        role: mockAdmin.role,
        isActive: mockAdmin.isActive,
      });
    });

    it('should return null when admin not found', async () => {
      mockPrismaService.adminUser.findUnique.mockResolvedValue(null);

      const result = await service.validateAdmin('invalid@test.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('generateApiKey', () => {
    it('should generate API key with mk_ prefix', () => {
      const apiKey = service.generateApiKey();
      
      expect(apiKey).toMatch(/^mk_/);
      expect(apiKey.length).toBeGreaterThan(10);
    });
  });
});
