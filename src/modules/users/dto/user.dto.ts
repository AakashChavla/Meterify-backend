import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export class CreateUserDto {
  @ApiProperty({ 
    description: 'User name',
    example: 'John Doe'
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ 
    description: 'User email address',
    example: 'john@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Pricing tier',
    enum: ['FREE', 'BASIC', 'PRO'],
    default: 'FREE',
    required: false
  })
  @IsOptional()
  @IsString()
  pricingTier?: string;

  @ApiProperty({ 
    description: 'Rate limit per window',
    default: 1000,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000000)
  rateLimit?: number;

  @ApiProperty({ 
    description: 'Rate limit window in seconds',
    default: 3600,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(86400)
  rateLimitWindow?: number;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ 
    description: 'User status',
    enum: UserStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
