import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message || 'An error occurred',
      error: status >= 500 ? 'Internal Server Error' : (typeof message === 'object' ? (message as any).error : undefined),
    };

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${errorResponse.message}`,
      exception instanceof Error ? exception.stack : undefined,
      'HttpExceptionFilter',
    );

    response.status(status).json(errorResponse);
  }
}
