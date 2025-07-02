import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto, UpdateUserDto, UserStatus } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate API key
    const apiKey = this.authService.generateApiKey();

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        apiKey,
        pricingTier: createUserDto.pricingTier || 'FREE',
        rateLimit: createUserDto.rateLimit || 1000,
        rateLimitWindow: createUserDto.rateLimitWindow || 3600,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      apiKey: user.apiKey,
      status: user.status,
      pricingTier: user.pricingTier,
      rateLimit: user.rateLimit,
      rateLimitWindow: user.rateLimitWindow,
      createdAt: user.createdAt,
    };
  }

  async findAllUsers(page: number = 1, limit: number = 10, status?: UserStatus) {
    const skip = (page - 1) * limit;
    
    const where = status ? { status } : {};
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          pricingTier: true,
          rateLimit: true,
          rateLimitWindow: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findUserByApiKey(apiKey: string) {
    return this.prisma.user.findUnique({
      where: { 
        apiKey,
        status: 'ACTIVE',
      },
    });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being updated and already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
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
      },
    });

    return updatedUser;
  }

  async regenerateApiKey(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newApiKey = this.authService.generateApiKey();

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { apiKey: newApiKey },
      select: {
        id: true,
        name: true,
        email: true,
        apiKey: true,
        status: true,
        pricingTier: true,
        rateLimit: true,
        rateLimitWindow: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by updating status
    await this.prisma.user.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    return { message: 'User deleted successfully' };
  }

  async getUserStats() {
    const [total, active, inactive, suspended] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'INACTIVE' } }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
    ]);

    return {
      total,
      active,
      inactive,
      suspended,
    };
  }
}
