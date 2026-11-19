import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InventoryMovementTypeEnum } from '../../common/enums';
import { Type } from 'class-transformer';

export class CreateMovementDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    enum: InventoryMovementTypeEnum,
    example: InventoryMovementTypeEnum.IN,
    description: 'Tipo de movimiento (IN, OUT, ADJUSTMENT)',
  })
  @IsEnum(InventoryMovementTypeEnum)
  type: InventoryMovementTypeEnum;

  @ApiProperty({ example: 20, description: 'Cantidad a ingresar, retirar o valor absoluto en ajuste' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'Ingreso por compra a proveedor Bavaria', description: 'Motivo o justificación' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ example: 'FACT-PROV-9874', required: false })
  @IsString()
  @IsOptional()
  referenceId?: string;
}
