import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateMovementDto } from './dto/inventory.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { RoleEnum, InventoryMovementTypeEnum } from '../common/enums';
import { User } from '../users/entities/user.entity';

@ApiTags('Inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('movements')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE)
  @ApiOperation({ summary: 'Registrar movimiento manual de inventario (Entrada/Salida/Ajuste)' })
  registerMovement(
    @Body() dto: CreateMovementDto,
    @CurrentUser() user: User,
  ) {
    return this.inventoryService.registerManualMovement(dto, user.id);
  }

  @Get('movements')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE)
  @ApiOperation({ summary: 'Historial de movimientos de inventario (Kardex)' })
  @ApiQuery({ name: 'productId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: InventoryMovementTypeEnum })
  findAllMovements(
    @Query('productId') productId?: string,
    @Query('type') type?: InventoryMovementTypeEnum,
  ) {
    return this.inventoryService.findAllMovements({ productId, type });
  }

  @Get('alerts/low-stock')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE)
  @ApiOperation({ summary: 'Alertas de productos con existencias bajas' })
  getLowStockAlerts() {
    return this.inventoryService.getLowStockAlerts();
  }
}
