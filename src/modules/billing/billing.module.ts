import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
