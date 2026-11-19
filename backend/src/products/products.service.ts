import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThanOrEqual } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const existingCode = await this.productRepository.findOne({
      where: { code: createProductDto.code.trim().toUpperCase() },
    });
    if (existingCode) {
      throw new ConflictException(`Ya existe un producto con el código "${createProductDto.code}"`);
    }

    await this.categoriesService.findOne(createProductDto.categoryId);

    const product = this.productRepository.create({
      ...createProductDto,
      code: createProductDto.code.trim().toUpperCase(),
      name: createProductDto.name.trim(),
    });

    return this.productRepository.save(product);
  }

  async findAll(query?: {
    search?: string;
    categoryId?: string;
    onlyActive?: boolean;
    lowStock?: boolean;
  }): Promise<Product[]> {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.name', 'ASC');

    if (query?.onlyActive) {
      qb.andWhere('product.isActive = :isActive', { isActive: true });
    }

    if (query?.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    if (query?.search) {
      qb.andWhere(
        '(LOWER(product.name) LIKE :search OR LOWER(product.code) LIKE :search OR LOWER(product.description) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    if (query?.lowStock) {
      qb.andWhere('product.stock <= product.minStock');
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return product;
  }

  async findByCode(code: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { code: code.toUpperCase() },
      relations: ['category'],
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (updateProductDto.code && updateProductDto.code.toUpperCase() !== product.code) {
      const existingCode = await this.productRepository.findOne({
        where: { code: updateProductDto.code.toUpperCase() },
      });
      if (existingCode) {
        throw new ConflictException(`Ya existe otro producto con el código "${updateProductDto.code}"`);
      }
      product.code = updateProductDto.code.toUpperCase();
    }

    if (updateProductDto.categoryId) {
      await this.categoriesService.findOne(updateProductDto.categoryId);
      product.categoryId = updateProductDto.categoryId;
    }

    if (updateProductDto.name !== undefined) product.name = updateProductDto.name.trim();
    if (updateProductDto.description !== undefined) product.description = updateProductDto.description;
    if (updateProductDto.imageUrl !== undefined) product.imageUrl = updateProductDto.imageUrl;
    if (updateProductDto.costPrice !== undefined) product.costPrice = Number(updateProductDto.costPrice);
    if (updateProductDto.sellingPrice !== undefined) product.sellingPrice = Number(updateProductDto.sellingPrice);
    if (updateProductDto.stock !== undefined) product.stock = Number(updateProductDto.stock);
    if (updateProductDto.minStock !== undefined) product.minStock = Number(updateProductDto.minStock);
    if (updateProductDto.isActive !== undefined) product.isActive = updateProductDto.isActive;

    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<{ message: string }> {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.productRepository.save(product);
    return { message: `Producto "${product.name}" desactivado correctamente` };
  }
}
