import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodEnum } from '../../common/enums';

export class CreateSaleItemDto {
  @ApiProperty({ description: 'ID del producto a vender' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2, description: 'Cantidad' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 0, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;
}

export class CreatePaymentDto {
  @ApiProperty({ enum: PaymentMethodEnum, example: PaymentMethodEnum.CASH })
  @IsEnum(PaymentMethodEnum)
  method: PaymentMethodEnum;

  @ApiProperty({ example: 36000, description: 'Monto pagado con este método' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'NEQUI-TRX-192837', required: false })
  @IsString()
  @IsOptional()
  referenceCode?: string;

  @ApiProperty({ example: 'Pago en efectivo billete 50k', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateSaleDto {
  @ApiProperty({ type: [CreateSaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @ApiProperty({ type: [CreatePaymentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  payments: CreatePaymentDto[];

  @ApiProperty({ example: 'Carlos Mendoza', required: false })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiProperty({ example: '1098765432', required: false })
  @IsString()
  @IsOptional()
  customerDocument?: string;

  @ApiProperty({ example: '+57 315 888 9900', required: false })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiProperty({ example: 0.08, description: 'Tasa de impuesto (ej. 8% impoconsumo o 19% IVA)', required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;

  @ApiProperty({ example: 0, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @ApiProperty({ example: 'Cliente solicita salsa adicional', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isDelivery?: boolean;

  @ApiProperty({ example: 'IDEM-948274-POS1', required: false, description: 'Clave de idempotencia única para reintentos de red' })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
