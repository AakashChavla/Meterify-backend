import { Test, TestingModule } from '@nestjs/testing';
import { PricingTierService } from './pricing-tier.service';
import { PrismaService } from '../../config/prisma.service';

describe('PricingTierService', () => {
  let service: PricingTierService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    pricingTier: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingTierService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PricingTierService>(PricingTierService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have createPricingTier method', () => {
    expect(service.createPricingTier).toBeDefined();
    expect(typeof service.createPricingTier).toBe('function');
  });

  it('should have findAllPricingTiers method', () => {
    expect(service.findAllPricingTiers).toBeDefined();
    expect(typeof service.findAllPricingTiers).toBe('function');
  });

  it('should have findPricingTierById method', () => {
    expect(service.findPricingTierById).toBeDefined();
    expect(typeof service.findPricingTierById).toBe('function');
  });

  it('should have updatePricingTier method', () => {
    expect(service.updatePricingTier).toBeDefined();
    expect(typeof service.updatePricingTier).toBe('function');
  });

  it('should have deletePricingTier method', () => {
    expect(service.deletePricingTier).toBeDefined();
    expect(typeof service.deletePricingTier).toBe('function');
  });

  describe('createPricingTier', () => {
    it('should call prisma to check existing tier and create new one', async () => {
      const createDto = {
        name: 'Basic',
        description: 'Basic tier',
        rateLimit: 1000,
        rateLimitWindow: 3600,
        pricePer1000Calls: 10.00,
        isActive: true,
      };

      mockPrismaService.pricingTier.findUnique.mockResolvedValue(null);
      mockPrismaService.pricingTier.create.mockResolvedValue({
        id: '1',
        ...createDto,
      });

      await service.createPricingTier(createDto);
      
      expect(mockPrismaService.pricingTier.findUnique).toHaveBeenCalledWith({
        where: { name: createDto.name },
      });
      expect(mockPrismaService.pricingTier.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('findAllPricingTiers', () => {
    it('should call prisma to find all active pricing tiers by default', async () => {
      mockPrismaService.pricingTier.findMany.mockResolvedValue([]);

      await service.findAllPricingTiers();
      
      expect(mockPrismaService.pricingTier.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { pricePer1000Calls: 'asc' },
      });
    });
  });
});
