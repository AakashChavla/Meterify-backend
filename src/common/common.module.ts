import { Module } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { HealthCheckService } from './services/health-check.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { DatabaseModule } from '../config/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [
    LoggerService,
    HealthCheckService,
    ApiKeyGuard,
    JwtAuthGuard,
    HttpExceptionFilter,
  ],
  exports: [
    LoggerService,
    HealthCheckService,
    ApiKeyGuard,
    JwtAuthGuard,
    HttpExceptionFilter,
  ],
})
export class CommonModule {}
