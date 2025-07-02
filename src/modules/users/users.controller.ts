import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'] })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    return this.usersService.findAllUsers(
      parseInt(page),
      parseInt(limit),
      status as any,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User stats retrieved successfully' })
  async getUserStats() {
    return this.usersService.getUserStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findUserById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Post(':id/regenerate-api-key')
  @ApiOperation({ summary: 'Regenerate user API key' })
  @ApiResponse({ status: 200, description: 'API key regenerated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async regenerateApiKey(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.regenerateApiKey(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deleteUser(id);
  }
}
