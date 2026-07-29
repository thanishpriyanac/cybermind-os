import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma, Connector, ConnectorExecution } from '@prisma/client';
import { IConnectorRepository } from '../../../domain/repositories/connector.repository';

@Injectable()
export class ConnectorPrismaRepository implements IConnectorRepository {
  private readonly prisma = new PrismaClient();

  async create(data: Prisma.ConnectorUncheckedCreateInput): Promise<Connector> {
    return this.prisma.connector.create({ data });
  }

  async findById(id: string): Promise<Connector | null> {
    return this.prisma.connector.findUnique({ where: { id }, include: { schedule: true, configuration: true } });
  }

  async updateState(id: string, lifecycleState: string): Promise<Connector> {
    return this.prisma.connector.update({ where: { id }, data: { lifecycleState } });
  }

  async logExecution(data: Prisma.ConnectorExecutionUncheckedCreateInput): Promise<ConnectorExecution> {
    return this.prisma.connectorExecution.create({ data });
  }
}
