import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { PdfService } from './pdf.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationController],
  providers: [EmailService, PdfService],
  exports: [EmailService, PdfService],
})
export class NotificationModule {}
