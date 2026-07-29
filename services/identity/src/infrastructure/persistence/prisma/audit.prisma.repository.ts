import { Injectable } from '@nestjs/common';
import { PrismaClient, AuditLog } from '@prisma/client';
import { IAuditRepository } from '../../../domain/repositories/audit.repository';

@Injectable()
export class AuditPrismaRepository implements IAuditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string, tenantId: string): Promise<AuditLog | null> {
    return this.prisma.auditLog.findFirst({ where: { id, tenantId } });
  }

  async create(data: Partial<AuditLog>): Promise<AuditLog> {
    return this.prisma.auditLog.create({ data: data as any });
  }

  async findByTenantId(tenantId: string, limit = 50, offset = 0): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async findByResourceId(resourceId: string): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { resourceId },
      orderBy: { timestamp: 'desc' },
    });
  }
}
