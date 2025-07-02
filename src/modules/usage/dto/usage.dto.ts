import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

export class LogApiUsageDto {
  @ApiProperty({ 
    description: 'User ID making the API call',
    example: 'uuid-string'
  })
  @IsUUID()
  userId: string;

  @ApiProperty({ 
    description: 'API endpoint path',
    example: '/api/v1/users'
  })
  @IsString()
  endpoint: string;

  @ApiProperty({ 
    description: 'HTTP method',
    enum: HttpMethod,
    example: 'GET'
  })
  @IsEnum(HttpMethod)
  method: HttpMethod;

  @ApiProperty({ 
    description: 'HTTP status code',
    example: 200
  })
  @IsInt()
  @Min(100)
  @Max(599)
  statusCode: number;

  @ApiProperty({ 
    description: 'Response time in milliseconds',
    example: 150
  })
  @IsInt()
  @Min(0)
  responseTime: number;

  @ApiProperty({ 
    description: 'Request size in bytes',
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  requestSize?: number;

  @ApiProperty({ 
    description: 'Response size in bytes',
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  responseSize?: number;

  @ApiProperty({ 
    description: 'Error message if request failed',
    required: false
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}

export class UsageQueryDto {
  @ApiProperty({ 
    description: 'Page number',
    default: 1,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Number of items per page',
    default: 50,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiProperty({ 
    description: 'Start date for filtering (YYYY-MM-DD)',
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  startDate?: Date;

  @ApiProperty({ 
    description: 'End date for filtering (YYYY-MM-DD)',
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  endDate?: Date;
}

export class AnalyticsQueryDto {
  @ApiProperty({ 
    description: 'Number of days to analyze',
    default: 7,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 7;

  @ApiProperty({ 
    description: 'Specific endpoint ID to analyze',
    required: false
  })
  @IsOptional()
  @IsUUID()
  endpointId?: string;
}
