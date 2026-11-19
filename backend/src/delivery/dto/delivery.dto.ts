import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DeliveryStatusEnum } from '../../common/enums';

export class CreateDeliveryOrderDto {
  @ApiProperty({ description: 'ID de la venta asociada al domicilio' })
  @IsUUID()
  @IsNotEmpty()
  saleId: string;

  @ApiProperty({ example: 'Andrés Morales' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ example: '+57 312 999 8877' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiProperty({ example: 'Carrera 27 # 45-12, Edificio Aurora' })
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @ApiProperty({ example: 'Cabecera del Llano', required: false })
  @IsString()
  @IsOptional()
  deliveryNeighborhood?: string;

  @ApiProperty({ example: 'Apto 604, dejar en portería si no contesta', required: false })
  @IsString()
  @IsOptional()
  deliveryNotes?: string;

  @ApiProperty({ example: 6000, description: 'Tarifa del servicio de domicilio', required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  deliveryFee?: number;

  @ApiProperty({ example: 40, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @IsOptional()
  estimatedMinutes?: number;
}

export class AssignDriverDto {
  @ApiProperty({ description: 'ID del repartidor asignado' })
  @IsUUID()
  @IsNotEmpty()
  driverId: string;
}

export class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: DeliveryStatusEnum, example: DeliveryStatusEnum.IN_TRANSIT })
  @IsEnum(DeliveryStatusEnum)
  status: DeliveryStatusEnum;
}
