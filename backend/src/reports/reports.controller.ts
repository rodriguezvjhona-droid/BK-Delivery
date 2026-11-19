import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { RoleEnum } from '../common/enums';

@ApiTags('Reportes y Finanzas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('financial')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Reporte financiero completo: Ingresos vs Costos vs Gastos vs Utilidad Neta (Solo ADMIN)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getFinancialReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getFinancialReport(startDate, endDate);
  }

  @Get('sales/excel')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Exportar histórico de ventas a formato Excel (.xlsx)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async exportSalesExcel(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const buffer = await this.reportsService.generateSalesExcel(startDate, endDate);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="BK_Ventas.xlsx"');
    res.send(buffer);
  }

  @Get('inventory/excel')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Exportar inventario y valorización a formato Excel (.xlsx)' })
  async exportInventoryExcel(@Res() res: Response) {
    const buffer = await this.reportsService.generateInventoryExcel();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="BK_Inventario.xlsx"');
    res.send(buffer);
  }
}
