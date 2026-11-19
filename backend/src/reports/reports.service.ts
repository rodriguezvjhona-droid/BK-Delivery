import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Sale } from '../sales/entities/sale.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Product } from '../products/entities/product.entity';
import { SaleStatusEnum } from '../common/enums';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Cálculo financiero empresarial riguroso: Ingresos vs CMV vs Gastos vs Utilidad Real
   */
  async getFinancialReport(startDate?: string, endDate?: string) {
    const qbSales = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.payments', 'payments')
      .where('sale.status = :status', { status: SaleStatusEnum.COMPLETED });

    const qbExpenses = this.expenseRepository
      .createQueryBuilder('expense');

    if (startDate && endDate) {
      qbSales.andWhere('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      qbExpenses.andWhere('expense.date BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const [sales, expenses] = await Promise.all([
      qbSales.getMany(),
      qbExpenses.getMany(),
    ]);

    const totalRevenue = sales.reduce((acc, s) => acc + Number(s.total), 0);
    const totalCostOfGoodsSold = sales.reduce((acc, s) => acc + Number(s.totalCost || 0), 0);
    const grossProfit = totalRevenue - totalCostOfGoodsSold;
    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const netProfit = grossProfit - totalExpenses;
    const netMarginPercentage = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Métodos de pago
    const paymentMethods: Record<string, number> = {
      CASH: 0,
      TRANSFER: 0,
      CARD: 0,
      OTHER: 0,
    };

    sales.forEach((s) => {
      s.payments?.forEach((p) => {
        paymentMethods[p.method] = (paymentMethods[p.method] || 0) + Number(p.amount);
      });
    });

    // Agrupación por días para gráficos financieros
    const dailyMap = new Map<string, { revenue: number; cost: number; expense: number }>();

    sales.forEach((s) => {
      const day = s.createdAt.toISOString().slice(0, 10);
      const curr = dailyMap.get(day) || { revenue: 0, cost: 0, expense: 0 };
      curr.revenue += Number(s.total);
      curr.cost += Number(s.totalCost || 0);
      dailyMap.set(day, curr);
    });

    expenses.forEach((e) => {
      const day = new Date(e.date).toISOString().slice(0, 10);
      const curr = dailyMap.get(day) || { revenue: 0, cost: 0, expense: 0 };
      curr.expense += Number(e.amount);
      dailyMap.set(day, curr);
    });

    const chartData = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        ingresos: data.revenue,
        costos: data.cost,
        gastos: data.expense,
        utilidadNeta: data.revenue - data.cost - data.expense,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRevenue,
      totalCostOfGoodsSold,
      grossProfit,
      totalExpenses,
      netProfit,
      netMarginPercentage: Number(netMarginPercentage.toFixed(2)),
      salesCount: sales.length,
      expensesCount: expenses.length,
      paymentMethods,
      chartData,
    };
  }

  /**
   * Exportación de Ventas a Excel
   */
  async generateSalesExcel(startDate?: string, endDate?: string): Promise<Buffer> {
    const qb = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('sale.payments', 'payments')
      .orderBy('sale.createdAt', 'DESC');

    if (startDate && endDate) {
      qb.where('sale.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const sales = await qb.getMany();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BK Delivery Enterprise';
    const worksheet = workbook.addWorksheet('Reporte de Ventas');

    worksheet.columns = [
      { header: 'Comprobante', key: 'invoiceNumber', width: 20 },
      { header: 'Fecha', key: 'createdAt', width: 22 },
      { header: 'Cliente', key: 'customerName', width: 25 },
      { header: 'Documento', key: 'customerDocument', width: 18 },
      { header: 'Subtotal ($)', key: 'subtotal', width: 15 },
      { header: 'Impuesto ($)', key: 'taxAmount', width: 15 },
      { header: 'Descuento ($)', key: 'discountAmount', width: 15 },
      { header: 'Total ($)', key: 'total', width: 16 },
      { header: 'Costo CMV ($)', key: 'totalCost', width: 16 },
      { header: 'Ganancia Bruta ($)', key: 'grossProfit', width: 18 },
      { header: 'Estado', key: 'status', width: 15 },
    ];

    sales.forEach((s) => {
      const gross = Number(s.total) - Number(s.totalCost || 0);
      worksheet.addRow({
        invoiceNumber: s.invoiceNumber,
        createdAt: s.createdAt.toISOString().replace('T', ' ').slice(0, 19),
        customerName: s.customerName,
        customerDocument: s.customerDocument,
        subtotal: Number(s.subtotal),
        taxAmount: Number(s.taxAmount),
        discountAmount: Number(s.discountAmount),
        total: Number(s.total),
        totalCost: Number(s.totalCost),
        grossProfit: gross,
        status: s.status,
      });
    });

    // Formato cabeceras
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF141619' },
    };

    return (await workbook.xlsx.writeBuffer()) as Buffer;
  }

  /**
   * Exportación de Inventario a Excel
   */
  async generateInventoryExcel(): Promise<Buffer> {
    const products = await this.productRepository.find({
      relations: ['category'],
      order: { name: 'ASC' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BK Delivery Enterprise';
    const worksheet = workbook.addWorksheet('Kardex Inventario');

    worksheet.columns = [
      { header: 'Código / SKU', key: 'code', width: 15 },
      { header: 'Producto', key: 'name', width: 30 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Costo Unitario ($)', key: 'costPrice', width: 18 },
      { header: 'Precio Venta ($)', key: 'sellingPrice', width: 18 },
      { header: 'Existencias', key: 'stock', width: 14 },
      { header: 'Stock Mínimo', key: 'minStock', width: 14 },
      { header: 'Valorización Costo ($)', key: 'totalCostValue', width: 22 },
      { header: 'Valorización Venta ($)', key: 'totalSaleValue', width: 22 },
      { header: 'Estado', key: 'status', width: 15 },
    ];

    products.forEach((p) => {
      const stock = Number(p.stock);
      const cost = Number(p.costPrice);
      const price = Number(p.sellingPrice);
      worksheet.addRow({
        code: p.code,
        name: p.name,
        category: p.category?.name || 'Sin Categoría',
        costPrice: cost,
        sellingPrice: price,
        stock,
        minStock: p.minStock,
        totalCostValue: stock * cost,
        totalSaleValue: stock * price,
        status: p.isActive ? (stock <= p.minStock ? 'STOCK BAJO' : 'ACTIVO') : 'INACTIVO',
      });
    });

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF991B1B' }, // BK Red
    };

    return (await workbook.xlsx.writeBuffer()) as Buffer;
  }
}
