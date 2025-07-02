import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Core modules
import { DatabaseModule } from './config/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { UsageModule } from './modules/usage/usage.module';
import { BillingModule } from './modules/billing/billing.module';
import { AdminModule } from './modules/admin/admin.module';
import { RateLimitModule } from './modules/rate-limit/rate-limit.module';

// Phase 2 modules
import { NotificationModule } from './modules/notification/notification.module';
import { PaymentModule } from './modules/payment/payment.module';

// Common modules
import { CommonModule } from './common/common.module';

// Controllers
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    DatabaseModule,

    // Scheduling for background tasks
    ScheduleModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute globally
      },
    ]),

    // Application modules
    CommonModule,
    AuthModule,
    UsersModule,
    UsageModule,
    BillingModule,
    AdminModule,
    RateLimitModule,

    // Phase 2 modules
    NotificationModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
