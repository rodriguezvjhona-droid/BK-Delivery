import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name.trim() },
    });
    if (existing) {
      throw new ConflictException(`Ya existe una categoría con el nombre "${createCategoryDto.name}"`);
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      name: createCategoryDto.name.trim(),
    });
    return this.categoryRepository.save(category);
  }

  async findAll(onlyActive: boolean = false): Promise<Category[]> {
    const where = onlyActive ? { isActive: true } : {};
    return this.categoryRepository.find({
      where,
      order: { name: 'ASC' },
      relations: ['products'],
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!category) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.name && updateCategoryDto.name.trim() !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name.trim() },
      });
      if (existing) {
        throw new ConflictException(`Ya existe una categoría con el nombre "${updateCategoryDto.name}"`);
      }
      category.name = updateCategoryDto.name.trim();
    }

    if (updateCategoryDto.description !== undefined) {
      category.description = updateCategoryDto.description;
    }

    if (updateCategoryDto.isActive !== undefined) {
      category.isActive = updateCategoryDto.isActive;
    }

    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<{ message: string }> {
    const category = await this.findOne(id);
    if (category.products && category.products.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar la categoría "${category.name}" porque tiene ${category.products.length} productos asociados. Desactívela en su lugar.`,
      );
    }
    await this.categoryRepository.remove(category);
    return { message: `Categoría "${category.name}" eliminada exitosamente` };
  }
}
