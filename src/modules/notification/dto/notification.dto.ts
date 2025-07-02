import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsObject, IsOptional, IsIn } from 'class-validator';

export class SendEmailDto {
  @ApiProperty({
    description: 'Type of email to send',
    enum: ['invoice', 'welcome', 'payment_confirmation'],
    example: 'invoice',
  })
  @IsString()
  @IsIn(['invoice', 'welcome', 'payment_confirmation'])
  type: 'invoice' | 'welcome' | 'payment_confirmation';

  @ApiProperty({
    description: 'Email data based on the type',
    example: {
      to: 'user@example.com',
      userName: 'John Doe',
      invoiceId: 'INV-001',
      amount: 500.00,
      dueDate: '2025-07-15',
    },
  })
  @IsObject()
  data: any;
}

export class GeneratePdfDto {
  @ApiProperty({
    description: 'Type of PDF to generate',
    enum: ['invoice', 'report'],
    example: 'invoice',
  })
  @IsString()
  @IsIn(['invoice', 'report'])
  type: 'invoice' | 'report';

  @ApiProperty({
    description: 'PDF generation data',
    example: {
      invoiceId: 'INV-001',
      customerName: 'John Doe',
      amount: 500.00,
      items: [
        { description: 'API Usage', quantity: 1000, rate: 0.50, amount: 500.00 }
      ],
    },
  })
  @IsObject()
  data: any;
}

export class SavePdfDto {
  @ApiProperty({
    description: 'Filename for the PDF',
    example: 'invoice-INV-001.pdf',
  })
  @IsString()
  filename: string;

  @ApiProperty({
    description: 'PDF buffer data (base64 encoded)',
  })
  pdfBuffer: Buffer;

  @ApiPropertyOptional({
    description: 'Directory path to save the PDF',
    example: 'invoices/2025/07',
  })
  @IsOptional()
  @IsString()
  directory?: string;
}
