import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async log(action: string, actor: string, details?: any, ipAddress: string = '127.0.0.1') {
    return this.prisma.auditLog.create({
      data: {
        action,
        actor,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
        ipAddress,
      },
    });
  }

  async findAll() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
