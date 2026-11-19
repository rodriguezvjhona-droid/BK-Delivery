import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PrintHistory } from './entities/print-history.entity';
import { SalesService } from '../sales/sales.service';
import { User } from '../users/entities/user.entity';

export interface BusinessConfig {
  name: string;
  nit: string;
  address: string;
  phone: string;
  regime: string;
  resolution: string;
  footerMessage: string;
  currency: string;
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(PrintHistory)
    private readonly printHistoryRepository: Repository<PrintHistory>,
    private readonly salesService: SalesService,
    private readonly configService: ConfigService,
  ) {}

  getBusinessConfig(): BusinessConfig {
    return {
      name: this.configService.get<string>('BUSINESS_NAME', 'BK Delivery - Sabores Alemanes & Gourmet'),
      nit: this.configService.get<string>('BUSINESS_NIT', '901.458.789-2'),
      address: this.configService.get<string>('BUSINESS_ADDRESS', 'Calle 45 # 18-32, Bucaramanga, Santander'),
      phone: this.configService.get<string>('BUSINESS_PHONE', '+57 312 456 7890'),
      regime: 'Responsable de Impuesto Nacional al Consumo (INC)',
      resolution: 'Resolución DIAN No. 187640001234 de 2026. Rango BK-0001 a BK-99999',
      footerMessage: '¡Vielen Dank für Ihren Besuch! Gracias por preferir la calidad alemana de BK Delivery.',
      currency: 'COP',
    };
  }

  async getInvoiceByNumber(invoiceNumber: string) {
    const sale = await this.salesService.findByInvoiceNumber(invoiceNumber);
    const business = this.getBusinessConfig();
    const history = await this.printHistoryRepository.find({
      where: { invoiceNumber },
      order: { printedAt: 'DESC' },
    });

    return {
      business,
      sale,
      reprintCount: history.length,
      isReprint: history.length > 0,
    };
  }

  async recordPrint(
    invoiceNumber: string,
    profile: string,
    user: User,
  ): Promise<PrintHistory> {
    const existingCount = await this.printHistoryRepository.count({
      where: { invoiceNumber },
    });

    const printRecord = this.printHistoryRepository.create({
      invoiceNumber,
      profile: profile || 'THERMAL_80MM',
      printCount: existingCount + 1,
      isReprint: existingCount > 0,
      userId: user.id,
      userName: user.fullName,
    });

    return this.printHistoryRepository.save(printRecord);
  }

  async getPrintHistory(invoiceNumber: string): Promise<PrintHistory[]> {
    return this.printHistoryRepository.find({
      where: { invoiceNumber },
      order: { printedAt: 'DESC' },
    });
  }

  /**
   * Arquitectura desacoplada para Proveedor Tecnológico DIAN (Facturación Electrónica Oficial)
   * Diseñado conforme a la normativa colombiana de la DIAN.
   */
  async prepareDianPayload(invoiceNumber: string) {
    const { business, sale } = await this.getInvoiceByNumber(invoiceNumber);

    return {
      status: 'DIAN_READY',
      notice: 'Este es el payload canónico para transmisión al Proveedor Tecnológico Autorizado (PTA). No confundir comprobante comercial POS con Factura Electrónica validada con CUFE.',
      dianDocument: {
        number: sale.invoiceNumber,
        issueDate: sale.createdAt.toISOString().slice(0, 10),
        issueTime: sale.createdAt.toISOString().slice(11, 19),
        company: {
          identification: business.nit,
          name: business.name,
          address: business.address,
        },
        customer: {
          identification: sale.customerDocument,
          name: sale.customerName,
          phone: sale.customerPhone,
        },
        lines: sale.items.map((item) => ({
          code: item.productCode,
          description: item.productName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
          taxAmount: Number(item.subtotal) * Number(sale.taxRate),
          total: Number(item.total),
        })),
        totals: {
          subtotal: Number(sale.subtotal),
          taxAmount: Number(sale.taxAmount),
          total: Number(sale.total),
        },
        cufePreview: 'SHA384_HASH_PENDING_PTA_SIGNATURE',
      },
    };
  }
}
