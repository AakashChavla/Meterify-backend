import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsObject } from 'class-validator';
import { OrderData, PaymentVerificationData } from '../payment.service';

export class CreateOrderDto implements OrderData {
  @ApiProperty({
    description: 'Order amount in smallest currency unit (e.g., paise for INR)',
    example: 50000,
    minimum: 1,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'INR',
    default: 'INR',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Unique receipt identifier for the order',
    example: 'receipt_order_123',
  })
  @IsString()
  receipt: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the order',
    example: {
      userId: 'user_123',
      invoiceId: 'inv_456',
      description: 'API usage payment',
    },
  })
  @IsOptional()
  @IsObject()
  notes?: {
    userId?: string;
    invoiceId?: string;
    [key: string]: any;
  };
}

export class VerifyPaymentDto implements PaymentVerificationData {
  @ApiProperty({
    description: 'Razorpay order ID from the created order',
    example: 'order_GWK8qDRXaT5oKT',
  })
  @IsString()
  razorpay_order_id: string;

  @ApiProperty({
    description: 'Razorpay payment ID received from frontend',
    example: 'pay_GWK8qDRXaT5oKT',
  })
  @IsString()
  razorpay_payment_id: string;

  @ApiProperty({
    description: 'Payment signature for verification',
    example: 'e7f88d26d5d6f4b6f4f1e5a7e6e5d5e5',
  })
  @IsString()
  razorpay_signature: string;
}

export class CapturePaymentDto {
  @ApiProperty({
    description: 'Amount to capture in smallest currency unit',
    example: 50000,
    minimum: 1,
  })
  @IsNumber()
  amount: number;
}
