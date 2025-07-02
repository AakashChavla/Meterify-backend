import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../config/prisma.service';
import { LoggerService } from '../../common/services/logger.service';
import { AuthService } from '../auth/auth.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockAuthService = {
    generateApiKey: jest.fn().mockReturnValue('mk_test_key_123'),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have createUser method', () => {
    expect(typeof service.createUser).toBe('function');
  });

  it('should have findAllUsers method', () => {
    expect(typeof service.findAllUsers).toBe('function');
  });

  it('should have findUserById method', () => {
    expect(typeof service.findUserById).toBe('function');
  });

  it('should have updateUser method', () => {
    expect(typeof service.updateUser).toBe('function');
  });

  it('should have deleteUser method', () => {
    expect(typeof service.deleteUser).toBe('function');
  });

  it('should have regenerateApiKey method', () => {
    expect(typeof service.regenerateApiKey).toBe('function');
  });

  it('should have getUserStats method', () => {
    expect(typeof service.getUserStats).toBe('function');
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const createUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        pricingTier: 'FREE',
      };

      const mockUser = {
        id: 'user-1',
        ...createUserDto,
        apiKey: 'mk_test_key_123',
        status: 'ACTIVE',
        rateLimit: 1000,
        rateLimitWindow: 3600,
        createdAt: new Date(),
      };

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.createUser(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockAuthService.generateApiKey).toHaveBeenCalled();
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...createUserDto,
          apiKey: 'mk_test_key_123',
          rateLimit: 1000,
          rateLimitWindow: 3600,
        },
      });
    });
  });

  describe('findUserById', () => {
    it('should find a user by id', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        status: 'ACTIVE',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findUserById(userId);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          apiKey: true,
          status: true,
          pricingTier: true,
          rateLimit: true,
          rateLimitWindow: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              usageLogs: true,
              monthlyUsage: true,
              invoices: true,
            },
          },
        },
      });
    });
  });
});
