import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EmailService, EmailResult } from './email.service';
import { PdfService, PdfResult } from './pdf.service';
import { SendEmailDto, GeneratePdfDto, SavePdfDto } from './dto/notification.dto';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
export class NotificationController {
  constructor(
    private readonly emailService: EmailService,
    private readonly pdfService: PdfService,
  ) {}

  @Post('email/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email notification' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<EmailResult> {
    const { type, data } = sendEmailDto;

    switch (type) {
      case 'invoice':
        return await this.emailService.sendInvoiceEmail(data);
      
      case 'welcome':
        return await this.emailService.sendWelcomeEmail(data);
      
      case 'payment_confirmation':
        return await this.emailService.sendPaymentConfirmationEmail(data);
      
      default:
        return {
          success: false,
          error: 'Invalid email type',
        };
    }
  }

  @Post('pdf/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate PDF invoice' })
  @ApiResponse({ status: 200, description: 'PDF generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generatePdf(@Body() invoiceData: any): Promise<PdfResult> {
    return await this.pdfService.generateInvoicePdf(invoiceData);
  }

  @Post('pdf/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save PDF invoice to disk' })
  @ApiResponse({ status: 200, description: 'PDF saved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async savePdf(@Body() invoiceData: any): Promise<PdfResult> {
    return await this.pdfService.saveInvoicePdf(invoiceData);
  }

  @Get('email/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify email service connection' })
  @ApiResponse({ status: 200, description: 'Email connection status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifyEmailConnection() {
    const isConnected = await this.emailService.verifyConnection();
    return {
      success: true,
      emailConnected: isConnected,
    };
  }

  @Post('storage/ensure')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ensure storage directories exist' })
  @ApiResponse({ status: 200, description: 'Storage directories verified' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async ensureStorage() {
    await this.pdfService.ensureStorageDirectory();
    return {
      success: true,
      message: 'Storage directories verified',
    };
  }
}
