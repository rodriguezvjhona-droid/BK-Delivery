import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodEnum } from '../../common/enums';

export class CreateExpenseDto {
  @ApiProperty({
    example: 'Materia Prima / Proveedores',
    description: 'Categoría del gasto (ej. Servicios, Nómina, Insumos, etc.)',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Compra de pan artesanal y verduras para el día' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 45000, description: 'Monto del gasto' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    enum: PaymentMethodEnum,
    example: PaymentMethodEnum.CASH,
    description: 'Método de pago utilizado',
  })
  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @ApiProperty({ example: 'https://storage.../factura-pan.jpg', required: false })
  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @ApiProperty({ example: '2026-11-19', required: false })
  @IsOptional()
  date?: Date;

  @ApiProperty({ example: 'Proveedor entregó recibo físico', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
