import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../config/prisma.service';
import { LoggerService } from '../../common/services/logger.service';
import { AuthService } from '../auth/auth.service';

describe('UsersService - Basic Tests', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockAuthService = {
    generateApiKey: jest.fn(),
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
});
