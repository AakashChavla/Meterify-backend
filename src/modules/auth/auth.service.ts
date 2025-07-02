import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../config/prisma.service';
import { LoginDto, RegisterAdminDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateAdmin(email: string, password: string): Promise<any> {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email },
    });

    if (admin && (await bcrypt.compare(password, admin.password))) {
      const { password: _, ...result } = admin;
      return result;
    }
    return null;
  }

  async loginAdmin(loginDto: LoginDto) {
    const admin = await this.validateAdmin(loginDto.email, loginDto.password);
    
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const payload = { 
      email: admin.email, 
      sub: admin.id, 
      role: admin.role 
    };

    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  async registerAdmin(registerDto: RegisterAdminDto) {
    // Check if admin already exists
    const existingAdmin = await this.prisma.adminUser.findUnique({
      where: { email: registerDto.email },
    });

    if (existingAdmin) {
      throw new UnauthorizedException('Admin with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Create admin
    const admin = await this.prisma.adminUser.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        role: 'ADMIN',
      },
    });

    const { password: _, ...result } = admin;
    return result;
  }

  async validateJWT(payload: any) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { 
        id: payload.sub,
        isActive: true,
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid token');
    }

    const { password: _, ...result } = admin;
    return result;
  }

  // Generate API key for users
  generateApiKey(): string {
    const prefix = 'mk_';
    const randomBytes = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15) +
                       Math.random().toString(36).substring(2, 15);
    return prefix + randomBytes;
  }
}
