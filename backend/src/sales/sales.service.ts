import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Product } from '../products/entities/product.entity';
import { CreateSaleDto } from './dto/sale.dto';
import { InventoryService } from '../inventory/inventory.service';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { SaleStatusEnum } from '../common/enums';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly inventoryService: InventoryService,
    private readonly cashRegisterService: CashRegisterService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Generación correlativa y única del número de comprobante/factura
   */
  private async generateInvoiceNumber(manager: any): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `BK-${dateStr}-`;

    const count = await manager
      .createQueryBuilder(Sale, 'sale')
      .where('sale.invoiceNumber LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();

    const sequence = (count + 1).toString().padStart(4, '0');
    return `${prefix}${sequence}`;
  }

  /**
   * Registro atómico y transaccional de una venta completa (POS)
   */
  async createSale(dto: CreateSaleDto, userId: string): Promise<Sale> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('La venta debe incluir al menos un producto');
    }

    if (!dto.payments || dto.payments.length === 0) {
      throw new BadRequestException('Debe registrar al menos un método de pago');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Generar número de factura único
      const invoiceNumber = await this.generateInvoiceNumber(manager);

      // 2. Procesar ítems y verificar disponibilidad de stock con bloqueo
      let calculatedSubtotal = 0;
      let calculatedTotalCost = 0;
      const saleItemsToSave: Partial<SaleItem>[] = [];
      const stockDeductionItems: { productId: string; quantity: number }[] = [];

      for (const itemDto of dto.items) {
        const product = await manager.findOne(Product, {
          where: { id: itemDto.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product || !product.isActive) {
          throw new NotFoundException(`Producto "${itemDto.productId}" no disponible o inactivo`);
        }

        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para "${product.name}". Existencias: ${product.stock}, Solicitadas: ${itemDto.quantity}`,
          );
        }

        const unitPrice = Number(product.sellingPrice);
        const unitCost = Number(product.costPrice);
        const itemDiscount = Number(itemDto.discount || 0);
        const itemSubtotal = unitPrice * itemDto.quantity;
        const itemTotal = Math.max(0, itemSubtotal - itemDiscount);

        calculatedSubtotal += itemSubtotal;
        calculatedTotalCost += unitCost * itemDto.quantity;

        saleItemsToSave.push({
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          quantity: itemDto.quantity,
          unitCost,
          unitPrice,
          subtotal: itemSubtotal,
          discount: itemDiscount,
          total: itemTotal,
        });

        stockDeductionItems.push({
          productId: product.id,
          quantity: itemDto.quantity,
        });
      }

      // 3. Cálculos de impuestos y totales
      const generalDiscount = Number(dto.discountAmount || 0);
      const taxRate = dto.taxRate !== undefined ? Number(dto.taxRate) : 0.08; // 8% impoconsumo por defecto
      const taxableAmount = Math.max(0, calculatedSubtotal - generalDiscount);
      const taxAmount = Number((taxableAmount * taxRate).toFixed(2));
      const grandTotal = Number((taxableAmount + taxAmount).toFixed(2));

      // 4. Validar que la suma de pagos coincida con el total
      const totalPaid = dto.payments.reduce((acc, p) => acc + Number(p.amount), 0);
      const diff = Math.abs(totalPaid - grandTotal);
      if (diff > 1.0) {
        throw new BadRequestException(
          `El total pagado ($${totalPaid.toLocaleString()}) no coincide con el total de la venta ($${grandTotal.toLocaleString()}). Diferencia: $${diff}`,
        );
      }

      // 5. Crear y persistir la entidad Sale
      const sale = manager.create(Sale, {
        invoiceNumber,
        subtotal: calculatedSubtotal,
        taxRate,
        taxAmount,
        discountAmount: generalDiscount,
        total: grandTotal,
        totalCost: calculatedTotalCost,
        status: SaleStatusEnum.COMPLETED,
        customerName: dto.customerName || 'Consumidor Final',
        customerDocument: dto.customerDocument || '222222222222',
        customerPhone: dto.customerPhone || null,
        userId,
        notes: dto.notes || null,
        isDelivery: dto.isDelivery || false,
      });

      const savedSale = await manager.save(sale);

      // 6. Guardar líneas de detalle de venta
      for (const item of saleItemsToSave) {
        item.saleId = savedSale.id;
        await manager.save(manager.create(SaleItem, item));
      }

      // 7. Guardar pagos y actualizar caja abierta
      for (const payDto of dto.payments) {
        const payment = manager.create(Payment, {
          saleId: savedSale.id,
          method: payDto.method,
          amount: Number(payDto.amount),
          referenceCode: payDto.referenceCode || null,
          notes: payDto.notes || null,
        });
        await manager.save(payment);

        // Notificar al servicio de caja
        await this.cashRegisterService.registerSalePayment(
          payDto.method,
          Number(payDto.amount),
          savedSale.id,
          invoiceNumber,
          userId,
          manager,
        );
      }

      // 8. Descontar inventario de forma atómica e idempotente
      await this.inventoryService.deductStockForSale(
        stockDeductionItems,
        savedSale.id,
        invoiceNumber,
        userId,
        manager,
      );

      return this.findOne(savedSale.id, manager);
    });
  }

  async findAll(query?: {
    startDate?: string;
    endDate?: string;
    status?: SaleStatusEnum;
    userId?: string;
  }): Promise<Sale[]> {
    const qb = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('sale.payments', 'payments')
      .orderBy('sale.createdAt', 'DESC');

    if (query?.status) {
      qb.andWhere('sale.status = :status', { status: query.status });
    }

    if (query?.userId) {
      qb.andWhere('sale.userId = :userId', { userId: query.userId });
    }

    if (query?.startDate && query?.endDate) {
      qb.andWhere('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      });
    }

    return qb.getMany();
  }

  async findOne(id: string, manager?: any): Promise<Sale> {
    const repo = manager ? manager.getRepository(Sale) : this.saleRepository;
    const sale = await repo.findOne({
      where: { id },
      relations: ['items', 'payments'],
    });
    if (!sale) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }
    return sale;
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { invoiceNumber },
      relations: ['items', 'payments'],
    });
    if (!sale) {
      throw new NotFoundException(`Venta con comprobante ${invoiceNumber} no encontrada`);
    }
    return sale;
  }

  /**
   * Métricas y KPIs de ventas para el Dashboard
   */
  async getDashboardStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    const [todaySales, weekSales, monthSales] = await Promise.all([
      this.saleRepository
        .createQueryBuilder('sale')
        .select('COALESCE(SUM(sale.total), 0)', 'total')
        .addSelect('COALESCE(SUM(sale.totalCost), 0)', 'totalCost')
        .addSelect('COUNT(sale.id)', 'count')
        .where('sale.createdAt >= :date', { date: startOfToday })
        .andWhere('sale.status = :status', { status: SaleStatusEnum.COMPLETED })
        .getRawOne(),
      this.saleRepository
        .createQueryBuilder('sale')
        .select('COALESCE(SUM(sale.total), 0)', 'total')
        .addSelect('COALESCE(SUM(sale.totalCost), 0)', 'totalCost')
        .addSelect('COUNT(sale.id)', 'count')
        .where('sale.createdAt >= :date', { date: startOfWeek })
        .andWhere('sale.status = :status', { status: SaleStatusEnum.COMPLETED })
        .getRawOne(),
      this.saleRepository
        .createQueryBuilder('sale')
        .select('COALESCE(SUM(sale.total), 0)', 'total')
        .addSelect('COALESCE(SUM(sale.totalCost), 0)', 'totalCost')
        .addSelect('COUNT(sale.id)', 'count')
        .where('sale.createdAt >= :date', { date: startOfMonth })
        .andWhere('sale.status = :status', { status: SaleStatusEnum.COMPLETED })
        .getRawOne(),
    ]);

    // Top 5 productos más vendidos del mes
    const topProducts = await this.saleItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.sale', 'sale')
      .select('item.productName', 'name')
      .addSelect('SUM(item.quantity)', 'totalQuantity')
      .addSelect('SUM(item.total)', 'totalRevenue')
      .where('sale.createdAt >= :date', { date: startOfMonth })
      .andWhere('sale.status = :status', { status: SaleStatusEnum.COMPLETED })
      .groupBy('item.productName')
      .orderBy('SUM(item.quantity)', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      today: {
        totalRevenue: Number(todaySales.total),
        totalCost: Number(todaySales.totalCost),
        grossProfit: Number(todaySales.total) - Number(todaySales.totalCost),
        orderCount: Number(todaySales.count),
      },
      week: {
        totalRevenue: Number(weekSales.total),
        totalCost: Number(weekSales.totalCost),
        grossProfit: Number(weekSales.total) - Number(weekSales.totalCost),
        orderCount: Number(weekSales.count),
      },
      month: {
        totalRevenue: Number(monthSales.total),
        totalCost: Number(monthSales.totalCost),
        grossProfit: Number(monthSales.total) - Number(monthSales.totalCost),
        orderCount: Number(monthSales.count),
      },
      topProducts,
    };
  }
}
