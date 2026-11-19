import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CashRegister } from './cash-register.entity';
import { PaymentMethodEnum } from '../../common/enums';

@Entity('cash_movements')
export class CashMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  cashRegisterId: string;

  @ManyToOne(() => CashRegister, (register) => register.movements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cashRegisterId' })
  cashRegister: CashRegister;

  @Column({ type: 'varchar', length: 20 }) // 'INCOME' | 'EXPENSE'
  type: 'INCOME' | 'EXPENSE';

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({
    type: 'enum',
    enum: PaymentMethodEnum,
    default: PaymentMethodEnum.CASH,
  })
  paymentMethod: PaymentMethodEnum;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
