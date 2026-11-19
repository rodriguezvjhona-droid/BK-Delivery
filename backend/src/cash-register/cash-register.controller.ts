import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CashRegisterService } from './cash-register.service';
import {
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  ManualCashMovementDto,
} from './dto/cash-register.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { RoleEnum } from '../common/enums';
import { User } from '../users/entities/user.entity';

@ApiTags('Control de Caja')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Get('current')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE)
  @ApiOperation({ summary: 'Consultar estado de la caja abierta actualmente' })
  getCurrent() {
    return this.cashRegisterService.getOpenRegister();
  }

  @Post('open')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE)
  @ApiOperation({ summary: 'Apertura de turno de caja con base inicial' })
  open(
    @Body() dto: OpenCashRegisterDto,
    @CurrentUser() user: User,
  ) {
    return this.cashRegisterService.openRegister(dto, user.id);
  }

  @Post('movement')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE)
  @ApiOperation({ summary: 'Registrar ingreso o egreso manual en efectivo' })
  addMovement(
    @Body() dto: ManualCashMovementDto,
    @CurrentUser() user: User,
  ) {
    return this.cashRegisterService.addManualMovement(dto, user.id);
  }

  @Post('close')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE)
  @ApiOperation({ summary: 'Cierre de caja y arqueo físico con cálculo de diferencias' })
  close(
    @Body() dto: CloseCashRegisterDto,
    @CurrentUser() user: User,
  ) {
    return this.cashRegisterService.closeRegister(dto, user.id);
  }

  @Get('history')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Historial de cierres de caja (Solo ADMIN)' })
  getHistory() {
    return this.cashRegisterService.getHistory();
  }
}
