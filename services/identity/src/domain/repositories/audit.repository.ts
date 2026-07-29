import { AuditLog } from '@prisma/client';

export interface IAuditRepository {
  findById(id: string, tenantId: string): Promise<AuditLog | null>;
  create(data: Partial<AuditLog>): Promise<AuditLog>;
  findByTenantId(tenantId: string, limit?: number, offset?: number): Promise<AuditLog[]>;
  findByResourceId(resourceId: string): Promise<AuditLog[]>;
}
