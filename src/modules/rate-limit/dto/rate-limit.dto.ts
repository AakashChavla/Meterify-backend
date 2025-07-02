import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRateLimitDto {
  @ApiProperty({ 
    description: 'Rate limit per window',
    example: 1000,
    minimum: 1,
    maximum: 1000000
  })
  @IsInt()
  @Min(1)
  @Max(1000000)
  rateLimit: number;

  @ApiProperty({ 
    description: 'Rate limit window in seconds',
    example: 3600,
    minimum: 60,
    maximum: 86400
  })
  @IsInt()
  @Min(60)
  @Max(86400)
  rateLimitWindow: number;
}
