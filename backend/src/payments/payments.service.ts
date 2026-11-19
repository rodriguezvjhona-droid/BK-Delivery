import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentMethodEnum } from '../common/enums';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async findAll(query?: {
    saleId?: string;
    method?: PaymentMethodEnum;
  }): Promise<Payment[]> {
    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.sale', 'sale')
      .orderBy('payment.createdAt', 'DESC');

    if (query?.saleId) {
      qb.andWhere('payment.saleId = :saleId', { saleId: query.saleId });
    }

    if (query?.method) {
      qb.andWhere('payment.method = :method', { method: query.method });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['sale'],
    });
    if (!payment) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }
    return payment;
  }
}
