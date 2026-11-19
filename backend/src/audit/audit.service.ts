import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(params: {
    userId?: string;
    userName?: string;
    action: string;
    module: string;
    details?: string;
    ipAddress?: string;
  }): Promise<AuditLog> {
    const entry = this.auditRepository.create(params);
    return this.auditRepository.save(entry);
  }

  async findAll(limit: number = 100): Promise<AuditLog[]> {
    return this.auditRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
