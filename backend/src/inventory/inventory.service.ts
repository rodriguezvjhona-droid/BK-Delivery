import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Product } from '../products/entities/product.entity';
import { CreateMovementDto } from './dto/inventory.dto';
import { InventoryMovementTypeEnum } from '../common/enums';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async registerManualMovement(
    dto: CreateMovementDto,
    userId: string,
  ): Promise<InventoryMovement> {
    return this.dataSource.transaction(async (manager) => {
      // Bloqueo pesimista para evitar concurrencia
      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException(`Producto con ID ${dto.productId} no encontrado`);
      }

      const previousStock = product.stock;
      let newStock = previousStock;

      if (dto.type === InventoryMovementTypeEnum.IN) {
        newStock = previousStock + dto.quantity;
      } else if (dto.type === InventoryMovementTypeEnum.OUT) {
        if (previousStock < dto.quantity) {
          throw new BadRequestException(
            `Existencias insuficientes para retirar ${dto.quantity}. Stock actual: ${previousStock}`,
          );
        }
        newStock = previousStock - dto.quantity;
      } else if (dto.type === InventoryMovementTypeEnum.ADJUSTMENT) {
        newStock = dto.quantity;
      }

      product.stock = newStock;
      await manager.save(product);

      const movement = manager.create(InventoryMovement, {
        productId: product.id,
        type: dto.type,
        quantity: dto.quantity,
        previousStock,
        newStock,
        reason: dto.reason,
        referenceId: dto.referenceId || null,
        userId,
      });

      return manager.save(movement);
    });
  }

  /**
   * Deducción atómica e idempotente de inventario al confirmar una venta
   */
  async deductStockForSale(
    items: { productId: string; quantity: number }[],
    saleId: string,
    invoiceNumber: string,
    userId: string,
    manager: EntityManager,
  ): Promise<void> {
    // 1. Verificación de Idempotencia: Verificar que no se haya descontado previamente
    const existingMovement = await manager.findOne(InventoryMovement, {
      where: { referenceId: saleId },
    });
    if (existingMovement) {
      throw new ConflictException(
        `El inventario para la venta ${invoiceNumber} ya fue procesado previamente.`,
      );
    }

    // 2. Descuento atómico con bloqueo de fila
    for (const item of items) {
      const product = await manager.findOne(Product, {
        where: { id: item.productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException(`Producto con ID ${item.productId} no encontrado`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para el producto "${product.name}". Disponible: ${product.stock}, Solicitado: ${item.quantity}`,
        );
      }

      const previousStock = product.stock;
      const newStock = previousStock - item.quantity;
      product.stock = newStock;
      await manager.save(product);

      const movement = manager.create(InventoryMovement, {
        productId: product.id,
        type: InventoryMovementTypeEnum.SALE,
        quantity: item.quantity,
        previousStock,
        newStock,
        reason: `Descuento automático por Venta ${invoiceNumber}`,
        referenceId: saleId,
        userId,
      });
      await manager.save(movement);
    }
  }

  async findAllMovements(query?: {
    productId?: string;
    type?: InventoryMovementTypeEnum;
    limit?: number;
  }): Promise<InventoryMovement[]> {
    const qb = this.movementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .orderBy('movement.createdAt', 'DESC');

    if (query?.productId) {
      qb.andWhere('movement.productId = :productId', { productId: query.productId });
    }

    if (query?.type) {
      qb.andWhere('movement.type = :type', { type: query.type });
    }

    if (query?.limit) {
      qb.take(query.limit);
    } else {
      qb.take(100);
    }

    return qb.getMany();
  }

  async getLowStockAlerts(): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.stock <= product.minStock')
      .andWhere('product.isActive = true')
      .orderBy('product.stock', 'ASC')
      .getMany();
  }
}
