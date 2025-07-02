import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { LoggerService } from './common/services/logger.service';
import { HealthCheckService } from './common/services/health-check.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const loggerService = app.get(LoggerService);
  const healthCheckService = app.get(HealthCheckService);
  
  app.useLogger(loggerService);

  // Security middlewares
  app.use(helmet());
  app.use(compression());

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter(loggerService));

  // API prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Meterify API')
    .setDescription('API Usage Tracking, Rate Limiting, Billing Automation with Payment Integration & Notifications')
    .setVersion('2.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
    .addServer('http://localhost:3000', 'Development server')
    .addTag('Health', 'Application health and status endpoints')
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management operations')
    .addTag('Usage Analytics', 'API usage tracking and analytics')
    .addTag('Usage Logging', 'API usage logging endpoints')
    .addTag('Rate Limiting', 'API rate limiting and throttling')
    .addTag('Billing', 'Invoice generation and billing management')
    .addTag('Payments', 'Payment processing with Razorpay integration')
    .addTag('Notifications', 'Email notifications and PDF generation')
    .addTag('Pricing Tiers', 'Pricing tier management')
    .addTag('Admin Dashboard', 'Administrative dashboard and metrics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('PORT', 3000);
  
  await app.listen(port);
  
  // Perform health checks after server is started
  await healthCheckService.checkAllServices();
  
  // Log that Nest application has started (using console.log for exact format)
  console.log(`[Nest] LOG [NestApplication] Nest application successfully started`);
  console.log(`Server is running on: http://localhost:${port}`);
}

bootstrap();
