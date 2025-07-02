import {
  Controller,
  Get,
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
import { UsageService } from './usage.service';
import { UsageQueryDto, AnalyticsQueryDto } from './dto/usage.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Usage Analytics')
@Controller('usage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get('summary/:userId')
  @ApiOperation({ summary: 'Get user usage summary for current month' })
  @ApiQuery({ name: 'monthYear', required: false, description: 'Month-Year (YYYY-MM)' })
  @ApiResponse({ status: 200, description: 'Usage summary retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserUsageSummary(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('monthYear') monthYear?: string,
  ) {
    return this.usageService.getUserUsageSummary(userId, monthYear);
  }

  @Get('logs/:userId')
  @ApiOperation({ summary: 'Get user usage logs with pagination' })
  @ApiResponse({ status: 200, description: 'Usage logs retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserUsageLogs(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: UsageQueryDto,
  ) {
    return this.usageService.getUserUsageLogs(
      userId,
      query.page,
      query.limit,
      query.startDate,
      query.endDate,
    );
  }

  @Get('analytics/endpoint')
  @ApiOperation({ summary: 'Get endpoint analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getEndpointAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.usageService.getEndpointAnalytics(query.endpointId, query.days);
  }

  @Get('analytics/system')
  @ApiOperation({ summary: 'Get system-wide analytics' })
  @ApiResponse({ status: 200, description: 'System analytics retrieved successfully' })
  async getSystemAnalytics() {
    return this.usageService.getSystemAnalytics();
  }
}
