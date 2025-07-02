import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { LogApiUsageDto } from './dto/usage.dto';
import { LoggerService } from '../../common/services/logger.service';
import moment from 'moment';

@Injectable()
export class UsageService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async logApiUsage(logDto: LogApiUsageDto, userAgent?: string, ipAddress?: string) {
    try {
      // Find or create endpoint
      let endpoint = await this.prisma.apiEndpoint.findFirst({
        where: {
          path: logDto.endpoint,
          method: logDto.method as any,
        },
      });

      if (!endpoint) {
        endpoint = await this.prisma.apiEndpoint.create({
          data: {
            name: `${logDto.method} ${logDto.endpoint}`,
            path: logDto.endpoint,
            method: logDto.method as any,
            description: `Auto-generated endpoint for ${logDto.method} ${logDto.endpoint}`,
          },
        });
      }

      // Create usage log
      const usageLog = await this.prisma.apiUsageLog.create({
        data: {
          userId: logDto.userId,
          endpointId: endpoint.id,
          statusCode: logDto.statusCode,
          responseTimeMs: logDto.responseTime,
          requestSize: logDto.requestSize,
          responseSize: logDto.responseSize,
          userAgent,
          ipAddress,
          errorMessage: logDto.errorMessage,
        },
      });

      // Update monthly usage summary
      await this.updateMonthlyUsage(logDto.userId, logDto.statusCode, logDto.responseTime);

      // Log to application logs
      this.logger.logApiUsage({
        userId: logDto.userId,
        endpoint: logDto.endpoint,
        method: logDto.method,
        statusCode: logDto.statusCode,
        responseTime: logDto.responseTime,
        userAgent,
        ipAddress,
      });

      return {
        id: usageLog.id,
        timestamp: usageLog.timestamp,
        message: 'Usage logged successfully',
      };
    } catch (error) {
      this.logger.error('Failed to log API usage', error.stack, 'UsageService');
      throw error;
    }
  }

  private async updateMonthlyUsage(userId: string, statusCode: number, responseTime: number) {
    const monthYear = moment().format('YYYY-MM');
    
    const existingUsage = await this.prisma.monthlyUsageSummary.findUnique({
      where: {
        userId_monthYear: {
          userId,
          monthYear,
        },
      },
    });

    const isSuccessful = statusCode >= 200 && statusCode < 400;
    
    if (existingUsage) {
      // Update existing record
      await this.prisma.monthlyUsageSummary.update({
        where: {
          userId_monthYear: {
            userId,
            monthYear,
          },
        },
        data: {
          totalCalls: { increment: 1 },
          successfulCalls: isSuccessful ? { increment: 1 } : undefined,
          failedCalls: !isSuccessful ? { increment: 1 } : undefined,
          avgResponseTime: {
            set: (existingUsage.avgResponseTime * existingUsage.totalCalls + responseTime) / (existingUsage.totalCalls + 1),
          },
        },
      });
    } else {
      // Create new record
      await this.prisma.monthlyUsageSummary.create({
        data: {
          userId,
          monthYear,
          totalCalls: 1,
          successfulCalls: isSuccessful ? 1 : 0,
          failedCalls: !isSuccessful ? 1 : 0,
          avgResponseTime: responseTime,
        },
      });
    }
  }

  async getUserUsageSummary(userId: string, monthYear?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentMonth = monthYear || moment().format('YYYY-MM');
    
    const summary = await this.prisma.monthlyUsageSummary.findUnique({
      where: {
        userId_monthYear: {
          userId,
          monthYear: currentMonth,
        },
      },
    });

    return {
      userId,
      monthYear: currentMonth,
      summary: summary || {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        avgResponseTime: 0,
      },
    };
  }

  async getUserUsageLogs(
    userId: string, 
    page: number = 1, 
    limit: number = 50,
    startDate?: Date,
    endDate?: Date
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const skip = (page - 1) * limit;
    
    const where: any = { userId };
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.apiUsageLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          endpoint: {
            select: {
              name: true,
              path: true,
              method: true,
            },
          },
        },
      }),
      this.prisma.apiUsageLog.count({ where }),
    ]);

    return {
      userId,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEndpointAnalytics(endpointId?: string, days: number = 7) {
    const startDate = moment().subtract(days, 'days').toDate();
    
    const where: any = {
      timestamp: { gte: startDate },
    };
    
    if (endpointId) {
      where.endpointId = endpointId;
    }

    const [totalCalls, avgResponseTime, statusCodeStats, topEndpoints] = await Promise.all([
      this.prisma.apiUsageLog.count({ where }),
      
      this.prisma.apiUsageLog.aggregate({
        where,
        _avg: { responseTimeMs: true },
      }),
      
      this.prisma.apiUsageLog.groupBy({
        by: ['statusCode'],
        where,
        _count: { statusCode: true },
      }),
      
      endpointId ? null : this.prisma.apiUsageLog.groupBy({
        by: ['endpointId'],
        where,
        _count: { endpointId: true },
        orderBy: { _count: { endpointId: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      period: `${days} days`,
      totalCalls,
      avgResponseTime: avgResponseTime._avg.responseTimeMs || 0,
      statusCodeStats,
      topEndpoints: topEndpoints ? await this.enrichEndpointStats(topEndpoints) : null,
    };
  }

  private async enrichEndpointStats(endpointStats: any[]) {
    const endpointIds = endpointStats.map(stat => stat.endpointId);
    
    const endpoints = await this.prisma.apiEndpoint.findMany({
      where: { id: { in: endpointIds } },
      select: { id: true, name: true, path: true, method: true },
    });

    return endpointStats.map(stat => {
      const endpoint = endpoints.find(ep => ep.id === stat.endpointId);
      return {
        ...stat,
        endpoint,
      };
    });
  }

  async getSystemAnalytics() {
    const today = moment().startOf('day').toDate();
    const yesterday = moment().subtract(1, 'day').startOf('day').toDate();
    const lastWeek = moment().subtract(7, 'days').startOf('day').toDate();
    const lastMonth = moment().subtract(30, 'days').startOf('day').toDate();

    const [
      todayStats,
      yesterdayStats,
      weekStats,
      monthStats,
      totalUsers,
      activeUsers,
    ] = await Promise.all([
      this.getStatsForPeriod(today),
      this.getStatsForPeriod(yesterday, today),
      this.getStatsForPeriod(lastWeek),
      this.getStatsForPeriod(lastMonth),
      this.prisma.user.count(),
      this.prisma.user.count({ 
        where: { 
          status: 'ACTIVE',
          usageLogs: {
            some: {
              timestamp: { gte: lastWeek },
            },
          },
        },
      }),
    ]);

    return {
      today: todayStats,
      yesterday: yesterdayStats,
      lastWeek: weekStats,
      lastMonth: monthStats,
      users: {
        total: totalUsers,
        active: activeUsers,
      },
    };
  }

  private async getStatsForPeriod(startDate: Date, endDate?: Date) {
    const where: any = {
      timestamp: { gte: startDate },
    };
    
    if (endDate) {
      where.timestamp.lt = endDate;
    }

    const [totalCalls, avgResponseTime, errorRate] = await Promise.all([
      this.prisma.apiUsageLog.count({ where }),
      
      this.prisma.apiUsageLog.aggregate({
        where,
        _avg: { responseTimeMs: true },
      }),
      
      this.prisma.apiUsageLog.aggregate({
        where: {
          ...where,
          statusCode: { gte: 400 },
        },
        _count: { id: true },
      }),
    ]);

    return {
      totalCalls,
      avgResponseTime: avgResponseTime._avg.responseTimeMs || 0,
      errorRate: totalCalls > 0 ? (errorRate._count.id / totalCalls) * 100 : 0,
    };
  }
}
