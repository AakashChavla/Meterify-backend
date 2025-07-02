import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UsageService } from './usage.service';
import { LogApiUsageDto } from './dto/usage.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@ApiTags('Usage Logging')
@Controller('log')
export class LoggingController {
  constructor(private readonly usageService: UsageService) {}

  @Post('usage')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Log API usage',
    description: 'Log API usage for tracking and billing. This endpoint should be called by your API after each request.'
  })
  @ApiResponse({ status: 200, description: 'Usage logged successfully' })
  @ApiResponse({ status: 401, description: 'Invalid API key' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async logUsage(@Body() logDto: LogApiUsageDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    return this.usageService.logApiUsage(logDto, userAgent, ipAddress);
  }
}
