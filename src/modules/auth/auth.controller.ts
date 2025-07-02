import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterAdminDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('admin/login')
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginAdmin(@Body() loginDto: LoginDto) {
    return this.authService.loginAdmin(loginDto);
  }

  @Post('admin/register')
  @ApiOperation({ summary: 'Register new admin (Super admin only)' })
  @ApiResponse({ status: 201, description: 'Admin registered successfully' })
  @ApiResponse({ status: 400, description: 'Admin already exists' })
  async registerAdmin(@Body() registerDto: RegisterAdminDto) {
    return this.authService.registerAdmin(registerDto);
  }

  @Get('admin/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Request() req) {
    return {
      admin: req.user,
    };
  }
}
