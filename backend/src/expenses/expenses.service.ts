import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/expense.dto';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { PaymentMethodEnum } from '../common/enums';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private readonly cashRegisterService: CashRegisterService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createExpenseDto: CreateExpenseDto, user: User): Promise<Expense> {
    return this.dataSource.transaction(async (manager) => {
      const expense = manager.create(Expense, {
        ...createExpenseDto,
        amount: Number(createExpenseDto.amount),
        responsibleUserId: user.id,
        responsibleName: user.fullName,
        date: createExpenseDto.date ? new Date(createExpenseDto.date) : new Date(),
      });

      const saved = await manager.save(expense);

      // Si el gasto se pagó en efectivo, se descuenta de la caja abierta
      if (createExpenseDto.paymentMethod === PaymentMethodEnum.CASH) {
        await this.cashRegisterService.registerExpenseMovement(
          saved.amount,
          saved.description,
          saved.id,
          user.id,
          manager,
        );
      }

      return saved;
    });
  }

  async findAll(query?: {
    category?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Expense[]> {
    const qb = this.expenseRepository
      .createQueryBuilder('expense')
      .orderBy('expense.date', 'DESC');

    if (query?.category) {
      qb.andWhere('expense.category = :category', { category: query.category });
    }

    if (query?.startDate && query?.endDate) {
      qb.andWhere('expense.date BETWEEN :startDate AND :endDate', {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({ where: { id } });
    if (!expense) {
      throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
    }
    return expense;
  }

  async getSummary() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    const [weekExpenses, monthExpenses, byCategory] = await Promise.all([
      this.expenseRepository
        .createQueryBuilder('expense')
        .select('COALESCE(SUM(expense.amount), 0)', 'total')
        .addSelect('COUNT(expense.id)', 'count')
        .where('expense.date >= :date', { date: startOfWeek })
        .getRawOne(),
      this.expenseRepository
        .createQueryBuilder('expense')
        .select('COALESCE(SUM(expense.amount), 0)', 'total')
        .addSelect('COUNT(expense.id)', 'count')
        .where('expense.date >= :date', { date: startOfMonth })
        .getRawOne(),
      this.expenseRepository
        .createQueryBuilder('expense')
        .select('expense.category', 'category')
        .addSelect('SUM(expense.amount)', 'total')
        .addSelect('COUNT(expense.id)', 'count')
        .where('expense.date >= :date', { date: startOfMonth })
        .groupBy('expense.category')
        .orderBy('SUM(expense.amount)', 'DESC')
        .getRawMany(),
    ]);

    return {
      week: {
        total: Number(weekExpenses.total),
        count: Number(weekExpenses.count),
      },
      month: {
        total: Number(monthExpenses.total),
        count: Number(monthExpenses.count),
      },
      byCategory,
    };
  }

  getCategories(): string[] {
    return [
      'Materia Prima e Insumos',
      'Servicios Públicos',
      'Nómina y Turnos',
      'Arriendo del Local',
      'Mantenimiento y Equipos',
      'Empaques y Desechables',
      'Publicidad y Mercadeo',
      'Transporte y Domicilios',
      'Gastos Varios',
    ];
  }
}
