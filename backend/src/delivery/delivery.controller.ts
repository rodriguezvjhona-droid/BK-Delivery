import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import {
  CreateDeliveryOrderDto,
  AssignDriverDto,
  UpdateDeliveryStatusDto,
} from './dto/delivery.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { RoleEnum, DeliveryStatusEnum } from '../common/enums';

@ApiTags('Domicilios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE)
  @ApiOperation({ summary: 'Registrar nuevo pedido de domicilio' })
  create(@Body() dto: CreateDeliveryOrderDto) {
    return this.deliveryService.create(dto);
  }

  @Get('active')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE, RoleEnum.DELIVERY)
  @ApiOperation({ summary: 'Consultar pedidos activos en despacho' })
  getActiveOrders() {
    return this.deliveryService.getActiveOrders();
  }

  @Get()
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE, RoleEnum.DELIVERY)
  @ApiOperation({ summary: 'Listar pedidos de domicilio con filtros' })
  @ApiQuery({ name: 'status', required: false, enum: DeliveryStatusEnum })
  @ApiQuery({ name: 'driverId', required: false })
  findAll(
    @Query('status') status?: DeliveryStatusEnum,
    @Query('driverId') driverId?: string,
  ) {
    return this.deliveryService.findAll({ status, driverId });
  }

  @Patch(':id/assign')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE)
  @ApiOperation({ summary: 'Asignar repartidor a un pedido' })
  assignDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignDriverDto,
  ) {
    return this.deliveryService.assignDriver(id, dto);
  }

  @Patch(':id/status')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE, RoleEnum.DELIVERY)
  @ApiOperation({ summary: 'Actualizar estado del domicilio (En ruta, Entregado, etc.)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveryService.updateStatus(id, dto);
  }

  @Get(':id')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE, RoleEnum.DELIVERY)
  @ApiOperation({ summary: 'Consultar detalle de un pedido de domicilio' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.deliveryService.findOne(id);
  }
}
