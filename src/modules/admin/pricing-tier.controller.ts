import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PricingTierService } from './pricing-tier.service';
import { CreatePricingTierDto, UpdatePricingTierDto } from './dto/pricing-tier.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Pricing Tiers')
@Controller('admin/pricing-tiers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PricingTierController {
  constructor(private readonly pricingTierService: PricingTierService) {}

  @Post()
  @ApiOperation({ summary: 'Create new pricing tier' })
  @ApiResponse({ status: 201, description: 'Pricing tier created successfully' })
  @ApiResponse({ status: 409, description: 'Pricing tier with this name already exists' })
  async createPricingTier(@Body() createDto: CreatePricingTierDto) {
    return this.pricingTierService.createPricingTier(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pricing tiers' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Pricing tiers retrieved successfully' })
  async findAllPricingTiers(@Query('includeInactive') includeInactive: string = 'false') {
    return this.pricingTierService.findAllPricingTiers(includeInactive === 'true');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get pricing tier statistics' })
  @ApiResponse({ status: 200, description: 'Pricing tier stats retrieved successfully' })
  async getPricingTierStats() {
    return this.pricingTierService.getPricingTierStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pricing tier by ID' })
  @ApiResponse({ status: 200, description: 'Pricing tier retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Pricing tier not found' })
  async findPricingTierById(@Param('id', ParseUUIDPipe) id: string) {
    return this.pricingTierService.findPricingTierById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update pricing tier' })
  @ApiResponse({ status: 200, description: 'Pricing tier updated successfully' })
  @ApiResponse({ status: 404, description: 'Pricing tier not found' })
  async updatePricingTier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePricingTierDto,
  ) {
    return this.pricingTierService.updatePricingTier(id, updateDto);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle pricing tier active status' })
  @ApiResponse({ status: 200, description: 'Pricing tier status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Pricing tier not found' })
  async togglePricingTierStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.pricingTierService.togglePricingTierStatus(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete pricing tier' })
  @ApiResponse({ status: 200, description: 'Pricing tier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Pricing tier not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete tier with active users' })
  async deletePricingTier(@Param('id', ParseUUIDPipe) id: string) {
    return this.pricingTierService.deletePricingTier(id);
  }
}
