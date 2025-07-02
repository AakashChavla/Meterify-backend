import {
  IsString,
  IsInt,
  IsDecimal,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePricingTierDto {
  @ApiProperty({ 
    description: 'Pricing tier name',
    example: 'Professional'
  })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ 
    description: 'Description of the pricing tier',
    example: 'Perfect for growing businesses',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ 
    description: 'Rate limit per window',
    example: 5000
  })
  @IsInt()
  @Min(1)
  @Max(1000000)
  rateLimit: number;

  @ApiProperty({ 
    description: 'Rate limit window in seconds',
    example: 3600
  })
  @IsInt()
  @Min(60)
  @Max(86400)
  rateLimitWindow: number;

  @ApiProperty({ 
    description: 'Price per 1000 API calls',
    example: 25.00
  })
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({ decimal_digits: '2' })
  pricePer1000Calls: number;

  @ApiProperty({ 
    description: 'Whether the pricing tier is active',
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePricingTierDto extends PartialType(CreatePricingTierDto) {}
