import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const logLevel = this.configService.get<string>('LOG_LEVEL', 'info');
    
    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack, context }) => {
          const contextStr = context ? `[${context}] ` : '';
          return `${timestamp} ${level}: ${contextStr}${message}${stack ? '\n' + stack : ''}`;
        }),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    });
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, stack?: string, context?: string) {
    this.logger.error(message, { stack, context });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Custom method for API usage logging
  logApiUsage(data: {
    userId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    userAgent?: string;
    ipAddress?: string;
  }) {
    this.logger.info('API_USAGE', {
      context: 'ApiUsage',
      ...data,
    });
  }

  // Custom method for rate limit logging
  logRateLimit(data: {
    userId: string;
    endpoint: string;
    currentCount: number;
    limit: number;
    windowStart: Date;
  }) {
    this.logger.warn('RATE_LIMIT_HIT', {
      context: 'RateLimit',
      ...data,
    });
  }

  // Custom method for billing events
  logBilling(data: {
    userId: string;
    monthYear: string;
    totalCalls: number;
    billAmount: number;
    event: 'GENERATED' | 'PAID' | 'OVERDUE';
  }) {
    this.logger.info('BILLING_EVENT', {
      context: 'Billing',
      ...data,
    });
  }
}
