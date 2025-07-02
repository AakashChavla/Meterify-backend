import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { HealthCheckService } from './common/services/health-check.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly healthCheckService: HealthCheckService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getHello(): object {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Basic health status' })
  getHealth(): object {
    return this.appService.getHealth();
  }

  @Get('health/detailed')
  @ApiOperation({ summary: 'Detailed health check with external services' })
  @ApiResponse({ status: 200, description: 'Detailed health status including external services' })
  async getDetailedHealth(): Promise<object> {
    return await this.healthCheckService.getHealthStatus();
  }
}
