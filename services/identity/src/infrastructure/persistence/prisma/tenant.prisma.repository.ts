import { Injectable } from '@nestjs/common';
import { PrismaClient, Tenant } from '@prisma/client';
import { ITenantRepository } from '../../../domain/repositories/tenant.repository';

@Injectable()
export class TenantPrismaRepository implements ITenantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  async create(data: Partial<Tenant>): Promise<Tenant> {
    return this.prisma.tenant.create({ data: data as any });
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    return this.prisma.tenant.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });
  }

  async findAll(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({ where: { deletedAt: null } });
  }
}
