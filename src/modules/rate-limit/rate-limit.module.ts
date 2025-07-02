import { Module } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { RateLimitController } from './rate-limit.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [RateLimitController],
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
