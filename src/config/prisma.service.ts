import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log: configService.get<string>('NODE_ENV') === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Database disconnected');
  }

  // Helper method to handle database errors
  async enableShutdownHooks() {
    process.on('beforeExit', async () => {
      await this.$disconnect();
    });
  }

  // Transaction helper
  async executeTransaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(fn);
  }
}
