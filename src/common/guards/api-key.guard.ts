import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: {
          apiKey,
          status: 'ACTIVE',
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid API key');
      }

      // Attach user to request for later use
      (request as any).user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid API key');
    }
  }

  private extractApiKey(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    const apiKeyHeader = request.headers['x-api-key'] as string;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return apiKeyHeader;
  }
}
