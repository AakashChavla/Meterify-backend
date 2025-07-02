import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreatePricingTierDto, UpdatePricingTierDto } from './dto/pricing-tier.dto';

@Injectable()
export class PricingTierService {
  constructor(private prisma: PrismaService) {}

  async createPricingTier(createDto: CreatePricingTierDto) {
    // Check if tier with this name already exists
    const existingTier = await this.prisma.pricingTier.findUnique({
      where: { name: createDto.name },
    });

    if (existingTier) {
      throw new ConflictException('Pricing tier with this name already exists');
    }

    const tier = await this.prisma.pricingTier.create({
      data: createDto,
    });

    return tier;
  }

  async findAllPricingTiers(includeInactive: boolean = false) {
    const where = includeInactive ? {} : { isActive: true };
    
    const tiers = await this.prisma.pricingTier.findMany({
      where,
      orderBy: { pricePer1000Calls: 'asc' },
    });

    return tiers;
  }

  async findPricingTierById(id: string) {
    const tier = await this.prisma.pricingTier.findUnique({
      where: { id },
    });

    if (!tier) {
      throw new NotFoundException('Pricing tier not found');
    }

    return tier;
  }

  async updatePricingTier(id: string, updateDto: UpdatePricingTierDto) {
    const tier = await this.prisma.pricingTier.findUnique({
      where: { id },
    });

    if (!tier) {
      throw new NotFoundException('Pricing tier not found');
    }

    // Check if name is being updated and already exists
    if (updateDto.name && updateDto.name !== tier.name) {
      const existingTier = await this.prisma.pricingTier.findUnique({
        where: { name: updateDto.name },
      });

      if (existingTier) {
        throw new ConflictException('Pricing tier with this name already exists');
      }
    }

    const updatedTier = await this.prisma.pricingTier.update({
      where: { id },
      data: updateDto,
    });

    return updatedTier;
  }

  async deletePricingTier(id: string) {
    const tier = await this.prisma.pricingTier.findUnique({
      where: { id },
    });

    if (!tier) {
      throw new NotFoundException('Pricing tier not found');
    }

    // Check if any users are using this tier
    const usersCount = await this.prisma.user.count({
      where: { pricingTier: tier.name },
    });

    if (usersCount > 0) {
      throw new ConflictException(
        `Cannot delete pricing tier. ${usersCount} user(s) are currently using this tier.`
      );
    }

    await this.prisma.pricingTier.delete({
      where: { id },
    });

    return { message: 'Pricing tier deleted successfully' };
  }

  async togglePricingTierStatus(id: string) {
    const tier = await this.prisma.pricingTier.findUnique({
      where: { id },
    });

    if (!tier) {
      throw new NotFoundException('Pricing tier not found');
    }

    const updatedTier = await this.prisma.pricingTier.update({
      where: { id },
      data: { isActive: !tier.isActive },
    });

    return updatedTier;
  }

  async getPricingTierStats() {
    const [totalTiers, activeTiers, usersByTier] = await Promise.all([
      this.prisma.pricingTier.count(),
      this.prisma.pricingTier.count({ where: { isActive: true } }),
      this.prisma.user.groupBy({
        by: ['pricingTier'],
        _count: { pricingTier: true },
      }),
    ]);

    return {
      totalTiers,
      activeTiers,
      userDistribution: usersByTier.map(item => ({
        tier: item.pricingTier,
        userCount: item._count.pricingTier,
      })),
    };
  }
}
