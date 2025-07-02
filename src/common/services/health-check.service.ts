import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';
import { PrismaService } from '../../config/prisma.service';
import * as nodemailer from 'nodemailer';
import Razorpay from 'razorpay';

export interface ServiceHealth {
  service: string;
  status: 'connected' | 'error';
  message: string;
  timestamp: Date;
}

@Injectable()
export class HealthCheckService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async checkAllServices(): Promise<ServiceHealth[]> {
    const results: ServiceHealth[] = [];

    // Check Database Connection
    results.push(await this.checkDatabase());

    // Check Email Service
    results.push(await this.checkEmailService());

    // Check Razorpay Connection
    results.push(await this.checkRazorpayService());

    // Log final results in clean format
    this.logFinalResults(results);

    return results;
  }

  private logFinalResults(results: ServiceHealth[]): void {
    // Log each service status
    results.forEach(result => {
      if (result.status === 'connected') {
        console.log(`✅ ${result.message}`);
      } else if (result.message.includes('not configured properly')) {
        console.log(`⚠️ ${result.message}`);
      } else {
        console.log(`❌ ${result.message}`);
      }
    });
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const result: ServiceHealth = {
        service: 'Database',
        status: 'connected',
        message: 'Database Connected Successfully',
        timestamp: new Date(),
      };
      return result;
    } catch (error) {
      const result: ServiceHealth = {
        service: 'Database',
        status: 'error',
        message: `Database connection failed: ${error.message}`,
        timestamp: new Date(),
      };
      return result;
    }
  }

  private async checkEmailService(): Promise<ServiceHealth> {
    try {
      const transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port: this.configService.get<number>('SMTP_PORT'),
        secure: false,
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });

      await transporter.verify();
      const result: ServiceHealth = {
        service: 'Email Service',
        status: 'connected',
        message: 'Mail service connected successfully',
        timestamp: new Date(),
      };
      return result;
    } catch (error) {
      const result: ServiceHealth = {
        service: 'Email Service',
        status: 'error',
        message: `SMTP connection failed: ${error.message}`,
        timestamp: new Date(),
      };
      return result;
    }
  }

  private async checkRazorpayService(): Promise<ServiceHealth> {
    try {
      const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
      const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

      if (!keyId || !keySecret || keyId === 'rzp_test_your_key_id' || keySecret === 'your_razorpay_secret_key') {
        const result: ServiceHealth = {
          service: 'Razorpay',
          status: 'error',
          message: 'Razorpay credentials not configured properly',
          timestamp: new Date(),
        };
        return result;
      }

      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      // Test connection by attempting to fetch plans (this will validate credentials)
      try {
        await razorpay.plans.all({ count: 1 });
        const result: ServiceHealth = {
          service: 'Razorpay',
          status: 'connected',
          message: 'Razorpay connected successfully',
          timestamp: new Date(),
        };
        return result;
      } catch (error) {
        const result: ServiceHealth = {
          service: 'Razorpay',
          status: 'error',
          message: `Razorpay connection failed: ${error.message}`,
          timestamp: new Date(),
        };
        return result;
      }
    } catch (error) {
      const result: ServiceHealth = {
        service: 'Razorpay',
        status: 'error',
        message: `Razorpay initialization failed: ${error.message}`,
        timestamp: new Date(),
      };
      return result;
    }
  }

  private logHealthSummary(results: ServiceHealth[]): void {
    const connected = results.filter(r => r.status === 'connected').length;
    const total = results.length;
    
    this.logger.log(`\n🏥 Health Check Summary: ${connected}/${total} services connected`);
    
    results.forEach(result => {
      const icon = result.status === 'connected' ? '✅' : '❌';
      this.logger.log(`${icon} ${result.service}: ${result.message}`);
    });
    
    if (connected === total) {
      this.logger.log('🎉 All external services are healthy!');
    } else {
      this.logger.warn(`⚠️ ${total - connected} service(s) have connection issues`);
    }
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: ServiceHealth[];
    timestamp: Date;
  }> {
    const services = await this.checkAllServices();
    const connected = services.filter(s => s.status === 'connected').length;
    const total = services.length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (connected === total) {
      status = 'healthy';
    } else if (connected > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      services,
      timestamp: new Date(),
    };
  }
}
