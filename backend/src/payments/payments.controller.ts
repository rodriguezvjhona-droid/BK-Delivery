import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { RoleEnum, PaymentMethodEnum } from '../common/enums';

@ApiTags('Pagos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE)
  @ApiOperation({ summary: 'Listar pagos y transacciones registradas' })
  @ApiQuery({ name: 'saleId', required: false })
  @ApiQuery({ name: 'method', required: false, enum: PaymentMethodEnum })
  findAll(
    @Query('saleId') saleId?: string,
    @Query('method') method?: PaymentMethodEnum,
  ) {
    return this.paymentsService.findAll({ saleId, method });
  }

  @Get(':id')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE)
  @ApiOperation({ summary: 'Consultar pago por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }
}
