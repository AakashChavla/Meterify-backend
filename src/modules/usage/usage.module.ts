import { Module } from '@nestjs/common';
import { UsageService } from './usage.service';
import { UsageController } from './usage.controller';
import { LoggingController } from './logging.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [UsageController, LoggingController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
