import { Tenant } from '@prisma/client';

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  create(data: Partial<Tenant>): Promise<Tenant>;
  update(id: string, data: Partial<Tenant>): Promise<Tenant>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Tenant[]>;
}
