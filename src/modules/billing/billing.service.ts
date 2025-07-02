import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';
import { LoggerService } from '../../common/services/logger.service';
import { ConfigService } from '@nestjs/config';
import moment from 'moment';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private configService: ConfigService,
  ) {}

  async generateMonthlyInvoices(monthYear?: string) {
    const targetMonth = monthYear || moment().subtract(1, 'month').format('YYYY-MM');
    
    this.logger.log(`Starting invoice generation for ${targetMonth}`, 'BillingService');

    // Get all active users with usage in the target month
    const usageSummaries = await this.prisma.monthlyUsageSummary.findMany({
      where: {
        monthYear: targetMonth,
        totalCalls: { gt: 0 },
        user: { status: 'ACTIVE' },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            pricingTier: true,
          },
        },
      },
    });

    const invoices = [];

    for (const usage of usageSummaries) {
      try {
        // Check if invoice already exists
        const existingInvoice = await this.prisma.billingInvoice.findUnique({
          where: {
            userId_monthYear: {
              userId: usage.userId,
              monthYear: targetMonth,
            },
          },
        });

        if (existingInvoice) {
          this.logger.warn(`Invoice already exists for user ${usage.userId} for ${targetMonth}`);
          continue;
        }

        // Calculate bill amount
        const billAmount = await this.calculateBillAmount(usage.totalCalls, usage.user.pricingTier);

        // Create invoice
        const invoice = await this.prisma.billingInvoice.create({
          data: {
            userId: usage.userId,
            monthYear: targetMonth,
            totalCalls: usage.totalCalls,
            billAmount,
            currency: this.configService.get<string>('CURRENCY', 'INR'),
            status: 'PENDING',
            dueDate: moment().add(30, 'days').toDate(),
          },
        });

        invoices.push(invoice);

        // Log billing event
        this.logger.logBilling({
          userId: usage.userId,
          monthYear: targetMonth,
          totalCalls: usage.totalCalls,
          billAmount: parseFloat(billAmount.toString()),
          event: 'GENERATED',
        });

      } catch (error) {
        this.logger.error(
          `Failed to generate invoice for user ${usage.userId}`,
          error.stack,
          'BillingService',
        );
      }
    }

    this.logger.log(`Generated ${invoices.length} invoices for ${targetMonth}`, 'BillingService');

    return {
      monthYear: targetMonth,
      invoicesGenerated: invoices.length,
      invoices: invoices.map(inv => ({
        id: inv.id,
        userId: inv.userId,
        totalCalls: inv.totalCalls,
        billAmount: inv.billAmount,
        status: inv.status,
      })),
    };
  }

  private async calculateBillAmount(totalCalls: number, pricingTier: string): Promise<number> {
    // Get pricing tier details
    const tier = await this.prisma.pricingTier.findFirst({
      where: { name: pricingTier, isActive: true },
    });

    let pricePerThousand = this.configService.get<number>('DEFAULT_PRICE_PER_1000_CALLS', 10);
    
    if (tier) {
      pricePerThousand = parseFloat(tier.pricePer1000Calls.toString());
    }

    // Calculate bill (totalCalls / 1000) * pricePerThousand
    const billAmount = Math.ceil(totalCalls / 1000) * pricePerThousand;
    
    return Math.max(0, billAmount); // Ensure non-negative
  }

  async getUserInvoices(userId: string, page: number = 1, limit: number = 10) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      this.prisma.billingInvoice.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { generatedAt: 'desc' },
      }),
      this.prisma.billingInvoice.count({ where: { userId } }),
    ]);

    return {
      userId,
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInvoiceById(invoiceId: string) {
    const invoice = await this.prisma.billingInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            pricingTier: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async markInvoicePaid(invoiceId: string) {
    const invoice = await this.prisma.billingInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const updatedInvoice = await this.prisma.billingInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Log billing event
    this.logger.logBilling({
      userId: invoice.userId,
      monthYear: invoice.monthYear,
      totalCalls: invoice.totalCalls,
      billAmount: parseFloat(invoice.billAmount.toString()),
      event: 'PAID',
    });

    return updatedInvoice;
  }

  async markInvoiceOverdue(invoiceId: string) {
    const invoice = await this.prisma.billingInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const updatedInvoice = await this.prisma.billingInvoice.update({
      where: { id: invoiceId },
      data: { status: 'OVERDUE' },
    });

    // Log billing event
    this.logger.logBilling({
      userId: invoice.userId,
      monthYear: invoice.monthYear,
      totalCalls: invoice.totalCalls,
      billAmount: parseFloat(invoice.billAmount.toString()),
      event: 'OVERDUE',
    });

    return updatedInvoice;
  }

  async getBillingStats(monthYear?: string) {
    const targetMonth = monthYear || moment().format('YYYY-MM');

    const [totalInvoices, paidInvoices, pendingInvoices, overdueInvoices, totalRevenue] = await Promise.all([
      this.prisma.billingInvoice.count({
        where: { monthYear: targetMonth },
      }),
      
      this.prisma.billingInvoice.count({
        where: { monthYear: targetMonth, status: 'PAID' },
      }),
      
      this.prisma.billingInvoice.count({
        where: { monthYear: targetMonth, status: 'PENDING' },
      }),
      
      this.prisma.billingInvoice.count({
        where: { monthYear: targetMonth, status: 'OVERDUE' },
      }),
      
      this.prisma.billingInvoice.aggregate({
        where: { monthYear: targetMonth, status: 'PAID' },
        _sum: { billAmount: true },
      }),
    ]);

    return {
      monthYear: targetMonth,
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue: totalRevenue._sum.billAmount || 0,
      collectionRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
    };
  }

  async getTopCustomers(limit: number = 10, monthYear?: string) {
    const targetMonth = monthYear || moment().format('YYYY-MM');

    const topCustomers = await this.prisma.billingInvoice.findMany({
      where: { monthYear: targetMonth },
      orderBy: { billAmount: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            pricingTier: true,
          },
        },
      },
    });

    return {
      monthYear: targetMonth,
      customers: topCustomers.map(invoice => ({
        user: invoice.user,
        totalCalls: invoice.totalCalls,
        billAmount: invoice.billAmount,
        status: invoice.status,
      })),
    };
  }

  // Cron job to automatically generate invoices on the 1st of each month
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async autoGenerateInvoices() {
    this.logger.log('Starting automatic invoice generation', 'BillingService');
    
    try {
      const result = await this.generateMonthlyInvoices();
      this.logger.log(`Auto-generated ${result.invoicesGenerated} invoices`, 'BillingService');
    } catch (error) {
      this.logger.error('Failed to auto-generate invoices', error.stack, 'BillingService');
    }
  }

  // Cron job to mark overdue invoices (runs daily)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async markOverdueInvoices() {
    const overdueDate = moment().toDate();

    const overdueInvoices = await this.prisma.billingInvoice.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: overdueDate },
      },
    });

    for (const invoice of overdueInvoices) {
      try {
        await this.markInvoiceOverdue(invoice.id);
      } catch (error) {
        this.logger.error(
          `Failed to mark invoice ${invoice.id} as overdue`,
          error.stack,
          'BillingService',
        );
      }
    }

    this.logger.log(`Marked ${overdueInvoices.length} invoices as overdue`, 'BillingService');
  }
}
