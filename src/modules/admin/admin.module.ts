import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PricingTierController } from './pricing-tier.controller';
import { PricingTierService } from './pricing-tier.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [AdminController, PricingTierController],
  providers: [AdminService, PricingTierService],
  exports: [AdminService, PricingTierService],
})
export class AdminModule {}
