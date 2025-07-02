import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaymentService, PaymentResult } from './payment.service';
import { CreateOrderDto, VerifyPaymentDto, CapturePaymentDto } from './dto/payment.dto';
import { Request } from 'express';

@ApiTags('Payments')
@Controller('api/v1/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('order/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Razorpay order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<PaymentResult> {
    return await this.paymentService.createOrder(createOrderDto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify payment signature' })
  @ApiResponse({ status: 200, description: 'Payment verification result' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  async verifyPayment(@Body() verifyPaymentDto: VerifyPaymentDto): Promise<PaymentResult> {
    return await this.paymentService.verifyPayment(verifyPaymentDto);
  }

  @Get('payment/:paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment details' })
  @ApiResponse({ status: 200, description: 'Payment details retrieved' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPaymentDetails(@Param('paymentId') paymentId: string): Promise<PaymentResult> {
    return await this.paymentService.getPaymentDetails(paymentId);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponse({ status: 200, description: 'Order details retrieved' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOrderDetails(@Param('orderId') orderId: string): Promise<PaymentResult> {
    return await this.paymentService.getOrderDetails(orderId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Razorpay webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
  ): Promise<PaymentResult> {
    const webhookBody = req.body;
    return await this.paymentService.processWebhook(webhookBody, signature);
  }

  @Post('capture/:paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Capture payment' })
  @ApiResponse({ status: 200, description: 'Payment captured successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async capturePayment(
    @Param('paymentId') paymentId: string,
    @Body() captureDto: CapturePaymentDto,
  ): Promise<PaymentResult> {
    return await this.paymentService.capturePayment(paymentId, captureDto.amount);
  }

  @Get('test-connection')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test Razorpay connection' })
  @ApiResponse({ status: 200, description: 'Connection test result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async testConnection() {
    const isConnected = await this.paymentService.testConnection();
    return {
      success: true,
      razorpayConnected: isConnected,
    };
  }

  @Post('generate-payment-url/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate payment URL' })
  @ApiResponse({ status: 200, description: 'Payment URL generated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generatePaymentUrl(@Param('orderId') orderId: string) {
    const paymentUrl = this.paymentService.generatePaymentUrl(orderId);
    return {
      success: true,
      paymentUrl,
    };
  }
}
