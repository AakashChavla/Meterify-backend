import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import moment from 'moment';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardOverview() {
    const now = moment();
    const todayStart = now.clone().startOf('day').toDate();
    const yesterdayStart = now.clone().subtract(1, 'day').startOf('day').toDate();
    const weekStart = now.clone().subtract(7, 'days').startOf('day').toDate();
    const monthStart = now.clone().startOf('month').toDate();

    const [
      totalUsers,
      activeUsers,
      totalApiCalls,
      todayApiCalls,
      totalRevenue,
      monthlyRevenue,
      pendingInvoices,
      overdueInvoices,
    ] = await Promise.all([
      // User stats
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      
      // API call stats
      this.prisma.apiUsageLog.count(),
      this.prisma.apiUsageLog.count({ 
        where: { timestamp: { gte: todayStart } } 
      }),
      
      // Revenue stats
      this.prisma.billingInvoice.aggregate({
        where: { status: 'PAID' },
        _sum: { billAmount: true },
      }),
      this.prisma.billingInvoice.aggregate({
        where: { 
          status: 'PAID',
          paidAt: { gte: monthStart },
        },
        _sum: { billAmount: true },
      }),
      
      // Invoice stats
      this.prisma.billingInvoice.count({ where: { status: 'PENDING' } }),
      this.prisma.billingInvoice.count({ where: { status: 'OVERDUE' } }),
    ]);

    // Get growth metrics
    const [yesterdayUsers, lastWeekUsers, lastMonthUsers] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: weekStart } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: monthStart } },
      }),
    ]);

    // Get API usage trends
    const apiUsageTrend = await this.getApiUsageTrend(7);
    
    // Get top endpoints
    const topEndpoints = await this.getTopEndpoints(5);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: yesterdayUsers,
        newThisWeek: lastWeekUsers,
        newThisMonth: lastMonthUsers,
      },
      apiUsage: {
        total: totalApiCalls,
        today: todayApiCalls,
        trend: apiUsageTrend,
        topEndpoints,
      },
      revenue: {
        total: totalRevenue._sum.billAmount || 0,
        thisMonth: monthlyRevenue._sum.billAmount || 0,
      },
      invoices: {
        pending: pendingInvoices,
        overdue: overdueInvoices,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  private async getApiUsageTrend(days: number) {
    const trends = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = moment().subtract(i, 'days');
      const startOfDay = date.clone().startOf('day').toDate();
      const endOfDay = date.clone().endOf('day').toDate();
      
      const count = await this.prisma.apiUsageLog.count({
        where: {
          timestamp: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
      
      trends.push({
        date: date.format('YYYY-MM-DD'),
        calls: count,
      });
    }
    
    return trends;
  }

  private async getTopEndpoints(limit: number) {
    const last7Days = moment().subtract(7, 'days').toDate();
    
    const endpointStats = await this.prisma.apiUsageLog.groupBy({
      by: ['endpointId'],
      where: {
        timestamp: { gte: last7Days },
      },
      _count: { endpointId: true },
      orderBy: { _count: { endpointId: 'desc' } },
      take: limit,
    });

    // Enrich with endpoint details
    const endpointIds = endpointStats.map(stat => stat.endpointId);
    const endpoints = await this.prisma.apiEndpoint.findMany({
      where: { id: { in: endpointIds } },
      select: { id: true, name: true, path: true, method: true },
    });

    return endpointStats.map(stat => {
      const endpoint = endpoints.find(ep => ep.id === stat.endpointId);
      return {
        endpoint,
        calls: stat._count.endpointId,
      };
    });
  }

  async getUserGrowthMetrics(days: number = 30) {
    const growth = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = moment().subtract(i, 'days');
      const startOfDay = date.clone().startOf('day').toDate();
      const endOfDay = date.clone().endOf('day').toDate();
      
      const newUsers = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
      
      growth.push({
        date: date.format('YYYY-MM-DD'),
        newUsers,
      });
    }
    
    return growth;
  }

  async getRevenueMetrics(months: number = 12) {
    const revenue = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = moment().subtract(i, 'months');
      const monthYear = date.format('YYYY-MM');
      
      const monthRevenue = await this.prisma.billingInvoice.aggregate({
        where: {
          monthYear,
          status: 'PAID',
        },
        _sum: { billAmount: true },
      });
      
      revenue.push({
        month: monthYear,
        revenue: monthRevenue._sum.billAmount || 0,
      });
    }
    
    return revenue;
  }

  async getSystemHealth() {
    const last24Hours = moment().subtract(24, 'hours').toDate();
    
    const [
      totalRequests,
      errorRequests,
      avgResponseTime,
      slowRequests,
      activeUsers,
      rateLimitHits,
    ] = await Promise.all([
      this.prisma.apiUsageLog.count({
        where: { timestamp: { gte: last24Hours } },
      }),
      
      this.prisma.apiUsageLog.count({
        where: { 
          timestamp: { gte: last24Hours },
          statusCode: { gte: 400 },
        },
      }),
      
      this.prisma.apiUsageLog.aggregate({
        where: { timestamp: { gte: last24Hours } },
        _avg: { responseTimeMs: true },
      }),
      
      this.prisma.apiUsageLog.count({
        where: { 
          timestamp: { gte: last24Hours },
          responseTimeMs: { gt: 1000 }, // > 1 second
        },
      }),
      
      this.prisma.user.count({
        where: {
          status: 'ACTIVE',
          usageLogs: {
            some: {
              timestamp: { gte: last24Hours },
            },
          },
        },
      }),
      
      this.prisma.rateLimitTracker.count({
        where: {
          windowStart: { gte: last24Hours },
          requestCount: { gte: 1000 }, // Assuming high usage indicates rate limit hits
        },
      }),
    ]);

    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    const slowRequestRate = totalRequests > 0 ? (slowRequests / totalRequests) * 100 : 0;

    return {
      period: '24 hours',
      requests: {
        total: totalRequests,
        errors: errorRequests,
        errorRate: Math.round(errorRate * 100) / 100,
        slow: slowRequests,
        slowRequestRate: Math.round(slowRequestRate * 100) / 100,
      },
      performance: {
        avgResponseTime: Math.round((avgResponseTime._avg.responseTimeMs || 0) * 100) / 100,
      },
      users: {
        active: activeUsers,
      },
      rateLimiting: {
        hits: rateLimitHits,
      },
      status: this.getHealthStatus(errorRate, avgResponseTime._avg.responseTimeMs || 0),
    };
  }

  private getHealthStatus(errorRate: number, avgResponseTime: number): string {
    if (errorRate > 10 || avgResponseTime > 2000) {
      return 'critical';
    } else if (errorRate > 5 || avgResponseTime > 1000) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }
}
