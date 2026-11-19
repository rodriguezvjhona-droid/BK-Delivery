import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/sale.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { RoleEnum, SaleStatusEnum } from '../common/enums';
import { User } from '../users/entities/user.entity';

@ApiTags('Ventas y Punto de Venta')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE)
  @ApiOperation({ summary: 'Registrar y confirmar una venta en el POS' })
  create(
    @Body() createSaleDto: CreateSaleDto,
    @CurrentUser() user: User,
  ) {
    return this.salesService.createSale(createSaleDto, user.id);
  }

  @Get()
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE)
  @ApiOperation({ summary: 'Listar historial de ventas con filtros' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'status', required: false, enum: SaleStatusEnum })
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: SaleStatusEnum,
  ) {
    return this.salesService.findAll({ startDate, endDate, status });
  }

  @Get('dashboard/stats')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE)
  @ApiOperation({ summary: 'Métricas de ventas y productos más vendidos' })
  getDashboardStats() {
    return this.salesService.getDashboardStats();
  }

  @Get('invoice/:invoiceNumber')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE, RoleEnum.DELIVERY)
  @ApiOperation({ summary: 'Buscar venta por número de comprobante' })
  findByInvoice(@Param('invoiceNumber') invoiceNumber: string) {
    return this.salesService.findByInvoiceNumber(invoiceNumber);
  }

  @Get(':id')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE, RoleEnum.DELIVERY)
  @ApiOperation({ summary: 'Consultar venta por ID con detalle y pagos' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.findOne(id);
  }
}
