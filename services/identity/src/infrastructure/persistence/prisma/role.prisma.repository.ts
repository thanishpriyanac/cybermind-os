import { Injectable } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import { IRoleRepository } from '../../../domain/repositories/role.repository';

@Injectable()
export class RolePrismaRepository implements IRoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string, tenantId: string): Promise<Role | null> {
    return this.prisma.role.findFirst({ where: { id, tenantId, deletedAt: null } });
  }

  async findByName(name: string, tenantId: string): Promise<Role | null> {
    return this.prisma.role.findFirst({ where: { name, tenantId, deletedAt: null } });
  }

  async create(data: Partial<Role>): Promise<Role> {
    return this.prisma.role.create({ data: data as any });
  }

  async update(id: string, data: Partial<Role>): Promise<Role> {
    return this.prisma.role.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });
  }

  async assignPermission(roleId: string, permissionId: string): Promise<void> {
    await this.prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    });
  }

  async removePermission(roleId: string, permissionId: string): Promise<void> {
    await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });
  }
}
