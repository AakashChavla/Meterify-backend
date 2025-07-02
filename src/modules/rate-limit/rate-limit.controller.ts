import {
  Controller,
  Get,
  Post,
  Put,
  Body,
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
import { RateLimitService } from './rate-limit.service';
import { UpdateRateLimitDto } from './dto/rate-limit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@ApiTags('Rate Limiting')
@Controller('rate-limit')
export class RateLimitController {
  constructor(private readonly rateLimitService: RateLimitService) {}

  @Get('check/:userId')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ 
    summary: 'Check rate limit for user',
    description: 'Check if user has exceeded their rate limit'
  })
  @ApiResponse({ status: 200, description: 'Rate limit status returned' })
  @ApiResponse({ status: 403, description: 'User not found or inactive' })
  async checkRateLimit(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.rateLimitService.checkRateLimit(userId);
  }

  @Post('increment/:userId')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ 
    summary: 'Increment rate limit counter',
    description: 'Increment the rate limit counter for a user'
  })
  @ApiResponse({ status: 200, description: 'Rate limit incremented' })
  async incrementRateLimit(@Param('userId', ParseUUIDPipe) userId: string) {
    await this.rateLimitService.incrementRateLimit(userId);
    return { message: 'Rate limit incremented' };
  }

  @Get('admin/user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user rate limit details (Admin)' })
  @ApiResponse({ status: 200, description: 'Rate limit details retrieved' })
  @ApiResponse({ status: 403, description: 'User not found' })
  async getUserRateLimit(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.rateLimitService.getUserRateLimit(userId);
  }

  @Put('admin/user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user rate limit (Admin)' })
  @ApiResponse({ status: 200, description: 'Rate limit updated successfully' })
  @ApiResponse({ status: 403, description: 'User not found' })
  async updateUserRateLimit(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateDto: UpdateRateLimitDto,
  ) {
    return this.rateLimitService.updateUserRateLimit(
      userId,
      updateDto.rateLimit,
      updateDto.rateLimitWindow,
    );
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get rate limit statistics (Admin)' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze' })
  @ApiResponse({ status: 200, description: 'Rate limit statistics retrieved' })
  async getRateLimitStats(@Query('days') days: string = '7') {
    return this.rateLimitService.getRateLimitStats(parseInt(days));
  }

  @Post('admin/cleanup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cleanup old rate limit trackers (Admin)' })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  async cleanupOldTrackers() {
    return this.rateLimitService.cleanupOldTrackers();
  }
}
