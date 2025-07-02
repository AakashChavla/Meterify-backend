import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Admin Dashboard')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Get admin dashboard overview',
    description: 'Get comprehensive overview of users, API usage, revenue, and system health'
  })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboardOverview() {
    return this.adminService.getDashboardOverview();
  }

  @Get('metrics/user-growth')
  @ApiOperation({ summary: 'Get user growth metrics' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze' })
  @ApiResponse({ status: 200, description: 'User growth metrics retrieved successfully' })
  async getUserGrowthMetrics(@Query('days') days: string = '30') {
    return this.adminService.getUserGrowthMetrics(parseInt(days));
  }

  @Get('metrics/revenue')
  @ApiOperation({ summary: 'Get revenue metrics' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Number of months to analyze' })
  @ApiResponse({ status: 200, description: 'Revenue metrics retrieved successfully' })
  async getRevenueMetrics(@Query('months') months: string = '12') {
    return this.adminService.getRevenueMetrics(parseInt(months));
  }

  @Get('system/health')
  @ApiOperation({ 
    summary: 'Get system health status',
    description: 'Get system health including error rates, performance metrics, and active users'
  })
  @ApiResponse({ status: 200, description: 'System health retrieved successfully' })
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }
}
