import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { LoggerService } from '../../common/services/logger.service';
import moment from 'moment';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  windowStart: Date;
}

@Injectable()
export class RateLimitService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async checkRateLimit(userId: string): Promise<RateLimitResult> {
    // Get user's rate limit settings
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        rateLimit: true,
        rateLimitWindow: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new ForbiddenException('User not found or inactive');
    }

    const windowStart = this.getWindowStart(user.rateLimitWindow);
    const windowEnd = moment(windowStart).add(user.rateLimitWindow, 'seconds').toDate();

    // Get or create rate limit tracker
    let tracker = await this.prisma.rateLimitTracker.findUnique({
      where: {
        userId_windowStart: {
          userId,
          windowStart,
        },
      },
    });

    if (!tracker) {
      // Create new tracker for this window
      tracker = await this.prisma.rateLimitTracker.create({
        data: {
          userId,
          windowStart,
          requestCount: 0,
        },
      });
    }

    const remaining = Math.max(0, user.rateLimit - tracker.requestCount);
    const allowed = tracker.requestCount < user.rateLimit;

    if (!allowed) {
      // Log rate limit hit
      this.logger.logRateLimit({
        userId,
        endpoint: 'N/A',
        currentCount: tracker.requestCount,
        limit: user.rateLimit,
        windowStart,
      });
    }

    return {
      allowed,
      limit: user.rateLimit,
      remaining,
      resetTime: windowEnd,
      windowStart,
    };
  }

  async incrementRateLimit(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { rateLimitWindow: true },
    });

    if (!user) {
      return;
    }

    const windowStart = this.getWindowStart(user.rateLimitWindow);

    // Increment the counter
    await this.prisma.rateLimitTracker.upsert({
      where: {
        userId_windowStart: {
          userId,
          windowStart,
        },
      },
      update: {
        requestCount: { increment: 1 },
      },
      create: {
        userId,
        windowStart,
        requestCount: 1,
      },
    });
  }

  async updateUserRateLimit(userId: string, rateLimit: number, rateLimitWindow: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        rateLimit,
        rateLimitWindow,
      },
    });

    return {
      message: 'Rate limit updated successfully',
      rateLimit,
      rateLimitWindow,
    };
  }

  async getUserRateLimit(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        rateLimit: true,
        rateLimitWindow: true,
        status: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const windowStart = this.getWindowStart(user.rateLimitWindow);
    
    const tracker = await this.prisma.rateLimitTracker.findUnique({
      where: {
        userId_windowStart: {
          userId,
          windowStart,
        },
      },
    });

    const currentUsage = tracker ? tracker.requestCount : 0;
    const remaining = Math.max(0, user.rateLimit - currentUsage);
    const windowEnd = moment(windowStart).add(user.rateLimitWindow, 'seconds').toDate();

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
      rateLimit: {
        limit: user.rateLimit,
        window: user.rateLimitWindow,
        currentUsage,
        remaining,
        windowStart,
        windowEnd,
      },
    };
  }

  async getRateLimitStats(days: number = 7) {
    const startDate = moment().subtract(days, 'days').toDate();

    const stats = await this.prisma.rateLimitTracker.groupBy({
      by: ['userId'],
      where: {
        windowStart: { gte: startDate },
      },
      _sum: { requestCount: true },
      _max: { requestCount: true },
      _count: { userId: true },
    });

    // Get user details
    const userIds = stats.map(stat => stat.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        rateLimit: true,
        rateLimitWindow: true,
      },
    });

    const enrichedStats = stats.map(stat => {
      const user = users.find(u => u.id === stat.userId);
      return {
        userId: stat.userId,
        user,
        totalRequests: stat._sum.requestCount,
        maxRequestsPerWindow: stat._max.requestCount,
        windows: stat._count.userId,
      };
    });

    return {
      period: `${days} days`,
      stats: enrichedStats,
    };
  }

  private getWindowStart(windowSeconds: number): Date {
    const now = moment();
    const windowStartSeconds = Math.floor(now.unix() / windowSeconds) * windowSeconds;
    return moment.unix(windowStartSeconds).toDate();
  }

  // Cleanup old rate limit trackers (call this periodically)
  async cleanupOldTrackers() {
    const cutoffDate = moment().subtract(7, 'days').toDate();
    
    const deletedCount = await this.prisma.rateLimitTracker.deleteMany({
      where: {
        windowStart: { lt: cutoffDate },
      },
    });

    this.logger.log(
      `Cleaned up ${deletedCount.count} old rate limit trackers`,
      'RateLimitService',
    );

    return deletedCount;
  }
}
