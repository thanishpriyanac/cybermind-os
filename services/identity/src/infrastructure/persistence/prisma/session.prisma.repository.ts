import { Injectable } from '@nestjs/common';
import { PrismaClient, Session } from '@prisma/client';
import { ISessionRepository } from '../../../domain/repositories/session.repository';

@Injectable()
export class SessionPrismaRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({ where: { id } });
  }

  async create(data: Partial<Session>): Promise<Session> {
    return this.prisma.session.create({ data: data as any });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    return this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }
}
