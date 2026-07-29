import { Prisma, Connector, ConnectorExecution } from '@prisma/client';

export interface IConnectorRepository {
  create(data: Prisma.ConnectorUncheckedCreateInput): Promise<Connector>;
  findById(id: string): Promise<Connector | null>;
  updateState(id: string, state: string): Promise<Connector>;
  logExecution(data: Prisma.ConnectorExecutionUncheckedCreateInput): Promise<ConnectorExecution>;
}
