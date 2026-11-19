import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleEnum } from '../../common/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'Hans Gruber', description: 'Nombre completo' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'hans@bkdelivery.com', description: 'Correo electrónico' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+57 300 123 4567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Password123!', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: RoleEnum, example: RoleEnum.EMPLOYEE })
  @IsEnum(RoleEnum)
  @IsOptional()
  role?: RoleEnum;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'Hans Gruber', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: '+57 300 123 4567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'NewPassword123!', required: false })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiProperty({ enum: RoleEnum, required: false })
  @IsEnum(RoleEnum)
  @IsOptional()
  role?: RoleEnum;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isActive?: boolean;
}
