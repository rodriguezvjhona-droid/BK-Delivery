import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { RoleEnum } from '../common/enums';
import { User } from '../users/entities/user.entity';

@ApiTags('Facturación e Impresión')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('config')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE)
  @ApiOperation({ summary: 'Obtener datos comerciales del negocio para comprobantes' })
  getConfig() {
    return this.invoicesService.getBusinessConfig();
  }

  @Get(':invoiceNumber')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE, RoleEnum.DELIVERY)
  @ApiOperation({ summary: 'Consultar datos de comprobante listos para impresión' })
  getInvoice(@Param('invoiceNumber') invoiceNumber: string) {
    return this.invoicesService.getInvoiceByNumber(invoiceNumber);
  }

  @Post(':invoiceNumber/print-log')
  @Roles(RoleEnum.ADMIN, RoleEnum.EMPLOYEE)
  @ApiOperation({ summary: 'Registrar evento de impresión o reimpresión autorizada' })
  recordPrint(
    @Param('invoiceNumber') invoiceNumber: string,
    @Body('profile') profile: string,
    @CurrentUser() user: User,
  ) {
    return this.invoicesService.recordPrint(invoiceNumber, profile, user);
  }

  @Get(':invoiceNumber/history')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Historial de impresiones y reimpresiones de una factura (Solo ADMIN)' })
  getHistory(@Param('invoiceNumber') invoiceNumber: string) {
    return this.invoicesService.getPrintHistory(invoiceNumber);
  }

  @Get(':invoiceNumber/dian-payload')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Payload estructurado desacoplado para integración con Proveedor Tecnológico DIAN' })
  getDianPayload(@Param('invoiceNumber') invoiceNumber: string) {
    return this.invoicesService.prepareDianPayload(invoiceNumber);
  }
}
