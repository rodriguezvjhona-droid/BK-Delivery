import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryOrder } from './entities/delivery-order.entity';
import { Sale } from '../sales/entities/sale.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateDeliveryOrderDto,
  AssignDriverDto,
  UpdateDeliveryStatusDto,
} from './dto/delivery.dto';
import { DeliveryStatusEnum, RoleEnum } from '../common/enums';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(DeliveryOrder)
    private readonly deliveryRepository: Repository<DeliveryOrder>,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateDeliveryOrderDto): Promise<DeliveryOrder> {
    const sale = await this.saleRepository.findOne({ where: { id: dto.saleId } });
    if (!sale) {
      throw new NotFoundException(`Venta con ID ${dto.saleId} no encontrada`);
    }

    const order = this.deliveryRepository.create({
      ...dto,
      deliveryFee: Number(dto.deliveryFee || 0),
      status: DeliveryStatusEnum.PENDING,
    });

    return this.deliveryRepository.save(order);
  }

  async assignDriver(id: string, dto: AssignDriverDto): Promise<DeliveryOrder> {
    const order = await this.findOne(id);
    const driver = await this.userRepository.findOne({ where: { id: dto.driverId } });

    if (!driver || !driver.isActive) {
      throw new NotFoundException('Repartidor no encontrado o inactivo');
    }

    if (driver.role !== RoleEnum.DELIVERY && driver.role !== RoleEnum.ADMIN) {
      throw new BadRequestException('El usuario seleccionado no tiene rol de repartidor');
    }

    order.driverId = driver.id;
    order.driverName = driver.fullName;
    order.status = DeliveryStatusEnum.ASSIGNED;

    return this.deliveryRepository.save(order);
  }

  async updateStatus(id: string, dto: UpdateDeliveryStatusDto): Promise<DeliveryOrder> {
    const order = await this.findOne(id);
    order.status = dto.status;

    if (dto.status === DeliveryStatusEnum.IN_TRANSIT) {
      order.dispatchedAt = new Date();
    } else if (dto.status === DeliveryStatusEnum.DELIVERED) {
      order.deliveredAt = new Date();
    }

    return this.deliveryRepository.save(order);
  }

  async findAll(query?: {
    status?: DeliveryStatusEnum;
    driverId?: string;
  }): Promise<DeliveryOrder[]> {
    const qb = this.deliveryRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.sale', 'sale')
      .leftJoinAndSelect('sale.items', 'items')
      .orderBy('order.createdAt', 'DESC');

    if (query?.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    if (query?.driverId) {
      qb.andWhere('order.driverId = :driverId', { driverId: query.driverId });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<DeliveryOrder> {
    const order = await this.deliveryRepository.findOne({
      where: { id },
      relations: ['sale', 'sale.items'],
    });
    if (!order) {
      throw new NotFoundException(`Pedido de domicilio con ID ${id} no encontrado`);
    }
    return order;
  }

  async getActiveOrders(): Promise<DeliveryOrder[]> {
    return this.deliveryRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.sale', 'sale')
      .leftJoinAndSelect('sale.items', 'items')
      .where('order.status IN (:...statuses)', {
        statuses: [
          DeliveryStatusEnum.PENDING,
          DeliveryStatusEnum.ASSIGNED,
          DeliveryStatusEnum.IN_TRANSIT,
        ],
      })
      .orderBy('order.createdAt', 'ASC')
      .getMany();
  }
}
