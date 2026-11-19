import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CashRegisterStatusEnum } from '../../common/enums';
import { CashMovement } from './cash-movement.entity';

@Entity('cash_registers')
export class CashRegister {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: CashRegisterStatusEnum,
    default: CashRegisterStatusEnum.OPEN,
  })
  status: CashRegisterStatusEnum;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  openingDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  closingDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  openingBalance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashSales: number;

  // Las transferencias y tarjetas se auditan por separado y NUNCA se suman al efectivo físico
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  transferSales: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cardSales: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashExpenses: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashIncomes: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  expectedCash: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  actualCash: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  difference: number;

  @Column({ type: 'uuid' })
  openedByUserId: string;

  @Column({ type: 'uuid', nullable: true })
  closedByUserId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => CashMovement, (movement) => movement.cashRegister)
  movements: CashMovement[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
