import { Injectable } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import { IUserRepository } from '../../../domain/repositories/user.repository';

@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string, tenantId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, tenantId, deletedAt: null },
    });
  }

  async create(data: Partial<User>): Promise<User> {
    return this.prisma.user.create({ data: data as any });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: { userId, roleId },
    });
  }
}
