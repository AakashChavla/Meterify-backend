import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'Welcome to Meterify API',
      version: '2.0.0',
      description: 'API Usage Tracking, Rate Limiting, Billing Automation with Payment Integration & Notifications',
      status: 'active',
      timestamp: new Date().toISOString(),
      features: {
        phase1: ['User Management', 'Usage Tracking', 'Rate Limiting', 'Billing System', 'Admin Dashboard'],
        phase2: ['Payment Integration (Razorpay)', 'Email Notifications', 'PDF Generation', 'Health Monitoring'],
        phase3: 'Coming Soon - Advanced Analytics & Enterprise Features'
      },
    };
  }

  getHealth(): object {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      },
    };
  }
}
