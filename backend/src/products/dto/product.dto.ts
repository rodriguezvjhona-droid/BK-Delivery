import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'BK-001', description: 'Código único / SKU' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Bratwurst Clásica', description: 'Nombre del producto' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Salchicha alemana artesanal con chucrut y mostaza dijon', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 8500, description: 'Costo de preparación / adquisición' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice: number;

  @ApiProperty({ example: 18000, description: 'Precio de venta al público' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @ApiProperty({ example: 50, description: 'Existencias iniciales' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 10, description: 'Umbral de stock bajo' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStock: number;

  @ApiProperty({ description: 'ID de la categoría asociada' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;
}

export class UpdateProductDto {
  @ApiProperty({ example: 'BK-001', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'Bratwurst Especial', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Descripción actualizada', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/...', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 9000, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @ApiProperty({ example: 20000, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  sellingPrice?: number;

  @ApiProperty({ example: 60, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiProperty({ example: 8, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
