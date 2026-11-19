import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class OpenCashRegisterDto {
  @ApiProperty({ example: 100000, description: 'Base inicial o saldo de apertura' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  openingBalance: number;

  @ApiProperty({ example: 'Apertura de turno mañana', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CloseCashRegisterDto {
  @ApiProperty({ example: 250000, description: 'Efectivo real contado en caja física' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualCash: number;

  @ApiProperty({ example: 'Cierre de turno sin novedades', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ManualCashMovementDto {
  @ApiProperty({ example: 'INCOME', enum: ['INCOME', 'EXPENSE'] })
  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';

  @ApiProperty({ example: 15000, description: 'Monto del movimiento' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'Ingreso extraordinario por cambio de monedas' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
