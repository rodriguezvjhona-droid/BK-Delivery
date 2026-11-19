import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('print_histories')
export class PrintHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  invoiceNumber: string;

  @Column({ type: 'varchar', length: 50, default: 'THERMAL_80MM' })
  profile: string; // 'THERMAL_80MM' | 'THERMAL_58MM' | 'COMMERCIAL_8_5X13'

  @Column({ type: 'int', default: 1 })
  printCount: number;

  @Column({ type: 'boolean', default: false })
  isReprint: boolean;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 150 })
  userName: string;

  @CreateDateColumn({ type: 'timestamp' })
  printedAt: Date;
}
