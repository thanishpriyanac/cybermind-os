import { Injectable } from '@nestjs/common';
import { PrismaClient, Permission } from '@prisma/client';
import { IPermissionRepository } from '../../../domain/repositories/permission.repository';

@Injectable()
export class PermissionPrismaRepository implements IPermissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Permission | null> {
    return this.prisma.permission.findUnique({ where: { id } });
  }

  async findByResourceAction(resource: string, action: string): Promise<Permission | null> {
    return this.prisma.permission.findFirst({
      where: { resource, action },
    });
  }

  async create(data: Partial<Permission>): Promise<Permission> {
    return this.prisma.permission.create({ data: data as any });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.permission.delete({ where: { id } });
  }

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany();
  }
}
