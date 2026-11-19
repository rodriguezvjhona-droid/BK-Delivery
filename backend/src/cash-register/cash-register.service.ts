import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { CashRegister } from './entities/cash-register.entity';
import { CashMovement } from './entities/cash-movement.entity';
import { CashRegisterStatusEnum, PaymentMethodEnum } from '../common/enums';
import {
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  ManualCashMovementDto,
} from './dto/cash-register.dto';

@Injectable()
export class CashRegisterService {
  constructor(
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepository: Repository<CashRegister>,
    @InjectRepository(CashMovement)
    private readonly cashMovementRepository: Repository<CashMovement>,
  ) {}

  async getOpenRegister(): Promise<CashRegister | null> {
    return this.cashRegisterRepository.findOne({
      where: { status: CashRegisterStatusEnum.OPEN },
      relations: ['movements'],
      order: { openingDate: 'DESC' },
    });
  }

  async openRegister(dto: OpenCashRegisterDto, userId: string): Promise<CashRegister> {
    const existing = await this.getOpenRegister();
    if (existing) {
      throw new ConflictException('Ya existe una caja abierta en el sistema. Debe cerrarla antes de abrir una nueva.');
    }

    const register = this.cashRegisterRepository.create({
      openingBalance: dto.openingBalance,
      expectedCash: dto.openingBalance,
      cashSales: 0,
      transferSales: 0,
      cardSales: 0,
      cashExpenses: 0,
      cashIncomes: 0,
      status: CashRegisterStatusEnum.OPEN,
      openedByUserId: userId,
      notes: dto.notes,
    });

    const saved = await this.cashRegisterRepository.save(register);

    // Registrar movimiento de apertura
    if (dto.openingBalance > 0) {
      const movement = this.cashMovementRepository.create({
        cashRegisterId: saved.id,
        type: 'INCOME',
        amount: dto.openingBalance,
        description: 'Base de apertura de caja',
        paymentMethod: PaymentMethodEnum.CASH,
        userId,
      });
      await this.cashMovementRepository.save(movement);
    }

    return saved;
  }

  /**
   * Registro atómico del pago de una venta en la caja activa
   */
  async registerSalePayment(
    method: PaymentMethodEnum,
    amount: number,
    saleId: string,
    invoiceNumber: string,
    userId: string,
    manager: EntityManager,
  ): Promise<void> {
    const register = await manager.findOne(CashRegister, {
      where: { status: CashRegisterStatusEnum.OPEN },
      lock: { mode: 'pessimistic_write' },
    });

    if (!register) {
      // Si la caja no está abierta, se permite la venta pero se registra advertencia
      return;
    }

    if (method === PaymentMethodEnum.CASH) {
      register.cashSales = Number(register.cashSales) + Number(amount);
      register.expectedCash = Number(register.expectedCash) + Number(amount);
    } else if (method === PaymentMethodEnum.TRANSFER) {
      // Las transferencias se totalizan separadamente y NUNCA se suman al efectivo físico
      register.transferSales = Number(register.transferSales) + Number(amount);
    } else if (method === PaymentMethodEnum.CARD) {
      register.cardSales = Number(register.cardSales) + Number(amount);
    }

    await manager.save(register);

    const movement = manager.create(CashMovement, {
      cashRegisterId: register.id,
      type: 'INCOME',
      amount,
      description: `Venta ${invoiceNumber} (${method})`,
      paymentMethod: method,
      referenceId: saleId,
      userId,
    });
    await manager.save(movement);
  }

  /**
   * Registro de gasto en efectivo desde caja
   */
  async registerExpenseMovement(
    amount: number,
    description: string,
    expenseId: string,
    userId: string,
    manager: EntityManager,
  ): Promise<void> {
    const register = await manager.findOne(CashRegister, {
      where: { status: CashRegisterStatusEnum.OPEN },
      lock: { mode: 'pessimistic_write' },
    });

    if (!register) return;

    register.cashExpenses = Number(register.cashExpenses) + Number(amount);
    register.expectedCash = Number(register.expectedCash) - Number(amount);
    await manager.save(register);

    const movement = manager.create(CashMovement, {
      cashRegisterId: register.id,
      type: 'EXPENSE',
      amount,
      description: `Gasto: ${description}`,
      paymentMethod: PaymentMethodEnum.CASH,
      referenceId: expenseId,
      userId,
    });
    await manager.save(movement);
  }

  async addManualMovement(
    dto: ManualCashMovementDto,
    userId: string,
  ): Promise<CashMovement> {
    const register = await this.getOpenRegister();
    if (!register) {
      throw new BadRequestException('No hay ninguna caja abierta en este momento.');
    }

    if (dto.type === 'INCOME') {
      register.cashIncomes = Number(register.cashIncomes) + Number(dto.amount);
      register.expectedCash = Number(register.expectedCash) + Number(dto.amount);
    } else {
      if (Number(register.expectedCash) < Number(dto.amount)) {
        throw new BadRequestException('Efectivo disponible en caja insuficiente para este egreso.');
      }
      register.cashExpenses = Number(register.cashExpenses) + Number(dto.amount);
      register.expectedCash = Number(register.expectedCash) - Number(dto.amount);
    }

    await this.cashRegisterRepository.save(register);

    const movement = this.cashMovementRepository.create({
      cashRegisterId: register.id,
      type: dto.type,
      amount: dto.amount,
      description: dto.description,
      paymentMethod: PaymentMethodEnum.CASH,
      userId,
    });

    return this.cashMovementRepository.save(movement);
  }

  async closeRegister(dto: CloseCashRegisterDto, userId: string): Promise<CashRegister> {
    const register = await this.getOpenRegister();
    if (!register) {
      throw new BadRequestException('No hay ninguna caja abierta para cerrar.');
    }

    register.actualCash = Number(dto.actualCash);
    register.difference = Number(dto.actualCash) - Number(register.expectedCash);
    register.status = CashRegisterStatusEnum.CLOSED;
    register.closingDate = new Date();
    register.closedByUserId = userId;
    if (dto.notes) {
      register.notes = register.notes ? `${register.notes} | ${dto.notes}` : dto.notes;
    }

    return this.cashRegisterRepository.save(register);
  }

  async getHistory(): Promise<CashRegister[]> {
    return this.cashRegisterRepository.find({
      order: { openingDate: 'DESC' },
      take: 50,
      relations: ['movements'],
    });
  }
}
