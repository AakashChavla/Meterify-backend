import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    description: 'Admin email address',
    example: 'admin@meterify.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Admin password',
    example: 'admin123'
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterAdminDto {
  @ApiProperty({ 
    description: 'Admin name',
    example: 'John Doe'
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ 
    description: 'Admin email address',
    example: 'admin@meterify.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Admin password (minimum 8 characters)',
    example: 'admin123'
  })
  @IsString()
  @MinLength(8)
  password: string;
}
