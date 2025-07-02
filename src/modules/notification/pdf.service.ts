import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as handlebars from 'handlebars';

export interface PdfResult {
  success: boolean;
  buffer?: Buffer;
  filePath?: string;
  filename?: string;
  error?: string;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  amount: number;
  user: {
    name: string;
    email: string;
  };
  dueDate: Date;
  createdAt: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(private configService: ConfigService) {}

  async generateInvoicePdf(invoiceData: InvoiceData): Promise<PdfResult> {
    let browser: puppeteer.Browser;
    let page: puppeteer.Page;

    try {
      const template = this.getInvoiceTemplate();
      const html = template({
        ...invoiceData,
        formattedAmount: this.formatCurrency(invoiceData.amount),
        formattedSubtotal: this.formatCurrency(invoiceData.subtotal),
        formattedTax: this.formatCurrency(invoiceData.tax),
        formattedTotal: this.formatCurrency(invoiceData.total),
        formattedDueDate: invoiceData.dueDate.toLocaleDateString('en-IN'),
        formattedCreatedDate: invoiceData.createdAt.toLocaleDateString('en-IN'),
        currentYear: new Date().getFullYear(),
        items: invoiceData.items.map(item => ({
          ...item,
          formattedUnitPrice: this.formatCurrency(item.unitPrice),
          formattedTotal: this.formatCurrency(item.total),
        })),
      });

      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      page = await browser.newPage();
      await page.setContent(html);

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      await page.close();
      await browser.close();

      this.logger.log(`PDF generated successfully for invoice ${invoiceData.invoiceNumber}`);

      return {
        success: true,
        buffer: pdfBuffer as Buffer,
        filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
      };
    } catch (error) {
      this.logger.error(`Failed to generate PDF: ${error.message}`);
      
      if (page) await page.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async saveInvoicePdf(invoiceData: InvoiceData): Promise<PdfResult> {
    try {
      const pdfResult = await this.generateInvoicePdf(invoiceData);
      
      if (!pdfResult.success) {
        return pdfResult;
      }

      await this.ensureStorageDirectory();

      const storageDir = this.configService.get<string>('PDF_STORAGE_PATH');
      const filename = `invoice-${invoiceData.invoiceNumber}.pdf`;
      const filePath = path.join(storageDir, filename);

      await fs.writeFile(filePath, pdfResult.buffer);

      this.logger.log(`PDF saved successfully: ${filePath}`);

      return {
        success: true,
        filePath,
        filename,
      };
    } catch (error) {
      this.logger.error(`Failed to save PDF: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async ensureStorageDirectory(): Promise<void> {
    const storageDir = this.configService.get<string>('PDF_STORAGE_PATH');
    
    try {
      await fs.access(storageDir);
    } catch {
      await fs.mkdir(storageDir, { recursive: true });
      this.logger.log(`Created storage directory: ${storageDir}`);
    }
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount / 100);
  }

  private getInvoiceTemplate(): HandlebarsTemplateDelegate {
    const template = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice {{invoiceNumber}}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; line-height: 1.6; color: #333; }
            .invoice-container { max-width: 800px; margin: 0 auto; padding: 40px; background: white; }
            .header { border-bottom: 3px solid #667eea; padding-bottom: 30px; margin-bottom: 40px; }
            .header-content { display: flex; justify-content: space-between; align-items: flex-start; }
            .logo-section h1 { color: #667eea; font-size: 36px; font-weight: 700; margin-bottom: 8px; }
            .logo-section p { color: #64748b; font-size: 16px; }
            .invoice-title { text-align: right; }
            .invoice-title h2 { color: #1e293b; font-size: 32px; font-weight: 600; margin-bottom: 8px; }
            .invoice-title p { color: #64748b; font-size: 16px; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .detail-section { flex: 1; }
            .detail-section h3 { color: #1e293b; font-size: 18px; font-weight: 600; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
            .detail-item { margin-bottom: 8px; }
            .detail-label { color: #64748b; font-weight: 500; }
            .detail-value { color: #1e293b; font-weight: 600; }
            .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .items-table th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 12px; text-align: left; font-weight: 600; font-size: 14px; }
            .items-table td { padding: 15px 12px; border-bottom: 1px solid #e2e8f0; }
            .items-table tbody tr:hover { background-color: #f8fafc; }
            .items-table .text-right { text-align: right; }
            .total-section { margin-top: 30px; }
            .total-table { width: 100%; max-width: 300px; margin-left: auto; }
            .total-table td { padding: 8px 12px; border: none; }
            .total-table .total-label { color: #64748b; font-weight: 500; }
            .total-table .total-value { color: #1e293b; font-weight: 600; text-align: right; }
            .grand-total { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
            .grand-total td { font-size: 16px; font-weight: 700; padding: 12px; }
            .payment-info { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 10px; margin: 40px 0; border-left: 4px solid #0ea5e9; }
            .payment-info h3 { color: #0c4a6e; margin-bottom: 15px; font-size: 18px; }
            .payment-info p { color: #075985; margin-bottom: 8px; }
            .footer { text-align: center; margin-top: 50px; padding-top: 30px; border-top: 2px solid #e2e8f0; color: #64748b; }
            .footer h3 { color: #1e293b; margin-bottom: 10px; }
            .footer p { margin-bottom: 5px; }
            @media print {
                .invoice-container { padding: 20px; }
                .payment-info { page-break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="header">
                <div class="header-content">
                    <div class="logo-section">
                        <h1>📊 Meterify</h1>
                        <p>API Usage Tracking & Billing</p>
                    </div>
                    <div class="invoice-title">
                        <h2>INVOICE</h2>
                        <p>{{invoiceNumber}}</p>
                    </div>
                </div>
            </div>

            <div class="invoice-details">
                <div class="detail-section">
                    <h3>Bill To</h3>
                    <div class="detail-item">
                        <div class="detail-value">{{user.name}}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">{{user.email}}</div>
                    </div>
                </div>
                <div class="detail-section">
                    <h3>Invoice Details</h3>
                    <div class="detail-item">
                        <span class="detail-label">Invoice Date: </span>
                        <span class="detail-value">{{formattedCreatedDate}}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Due Date: </span>
                        <span class="detail-value">{{formattedDueDate}}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Invoice ID: </span>
                        <span class="detail-value">{{id}}</span>
                    </div>
                </div>
            </div>

            {{#if items.length}}
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="text-right">Quantity</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each items}}
                    <tr>
                        <td>{{description}}</td>
                        <td class="text-right">{{quantity}}</td>
                        <td class="text-right">{{formattedUnitPrice}}</td>
                        <td class="text-right">{{formattedTotal}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
            {{/if}}

            <div class="total-section">
                <table class="total-table">
                    <tr>
                        <td class="total-label">Subtotal:</td>
                        <td class="total-value">{{formattedSubtotal}}</td>
                    </tr>
                    {{#if tax}}
                    <tr>
                        <td class="total-label">Tax:</td>
                        <td class="total-value">{{formattedTax}}</td>
                    </tr>
                    {{/if}}
                    <tr class="grand-total">
                        <td>Total Amount:</td>
                        <td>{{formattedTotal}}</td>
                    </tr>
                </table>
            </div>

            <div class="payment-info">
                <h3>💳 Payment Information</h3>
                <p><strong>Payment is due within 30 days of invoice date.</strong></p>
                <p>You can pay online through our secure payment portal using the invoice number.</p>
                <p>For any payment-related queries, please contact our billing team.</p>
            </div>

            <div class="footer">
                <h3>Meterify</h3>
                <p>API Usage Tracking & Billing Platform</p>
                <p>© {{currentYear}} Meterify. All rights reserved.</p>
                <p>support@meterify.com | www.meterify.com</p>
            </div>
        </div>
    </body>
    </html>
    `;
    return handlebars.compile(template);
  }
}
