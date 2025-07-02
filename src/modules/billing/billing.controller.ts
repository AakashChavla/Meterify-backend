import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Billing')
@Controller('billing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('admin/generate-invoices')
  @ApiOperation({ 
    summary: 'Generate monthly invoices (Admin)',
    description: 'Generate invoices for all users for a specific month'
  })
  @ApiQuery({ name: 'monthYear', required: false, description: 'Month-Year (YYYY-MM). Defaults to previous month' })
  @ApiResponse({ status: 201, description: 'Invoices generated successfully' })
  async generateMonthlyInvoices(@Query('monthYear') monthYear?: string) {
    return this.billingService.generateMonthlyInvoices(monthYear);
  }

  @Get('invoices/:userId')
  @ApiOperation({ summary: 'Get user invoices' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserInvoices(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.billingService.getUserInvoices(
      userId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('invoice/:invoiceId')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoiceById(@Param('invoiceId', ParseUUIDPipe) invoiceId: string) {
    return this.billingService.getInvoiceById(invoiceId);
  }

  @Patch('admin/invoice/:invoiceId/mark-paid')
  @ApiOperation({ summary: 'Mark invoice as paid (Admin)' })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async markInvoicePaid(@Param('invoiceId', ParseUUIDPipe) invoiceId: string) {
    return this.billingService.markInvoicePaid(invoiceId);
  }

  @Patch('admin/invoice/:invoiceId/mark-overdue')
  @ApiOperation({ summary: 'Mark invoice as overdue (Admin)' })
  @ApiResponse({ status: 200, description: 'Invoice marked as overdue' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async markInvoiceOverdue(@Param('invoiceId', ParseUUIDPipe) invoiceId: string) {
    return this.billingService.markInvoiceOverdue(invoiceId);
  }

  @Get('admin/stats')
  @ApiOperation({ summary: 'Get billing statistics (Admin)' })
  @ApiQuery({ name: 'monthYear', required: false, description: 'Month-Year (YYYY-MM)' })
  @ApiResponse({ status: 200, description: 'Billing stats retrieved successfully' })
  async getBillingStats(@Query('monthYear') monthYear?: string) {
    return this.billingService.getBillingStats(monthYear);
  }

  @Get('admin/top-customers')
  @ApiOperation({ summary: 'Get top customers by revenue (Admin)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'monthYear', required: false, description: 'Month-Year (YYYY-MM)' })
  @ApiResponse({ status: 200, description: 'Top customers retrieved successfully' })
  async getTopCustomers(
    @Query('limit') limit: string = '10',
    @Query('monthYear') monthYear?: string,
  ) {
    return this.billingService.getTopCustomers(parseInt(limit), monthYear);
  }
}
