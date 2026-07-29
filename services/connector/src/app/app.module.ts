import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConnectorController } from './connector.controller';
import { ConnectorDomainService } from '../domain/services/connector.domain.service';
import { ExecutionEngine } from '../domain/services/execution-engine.service';
import { ConnectorPrismaRepository } from '../infrastructure/persistence/prisma/connector.prisma.repository';
import { EventPlatformModule } from '@cybermind-os/event-client';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventPlatformModule.forRoot({
      clientId: 'connector-service',
      brokers: ['localhost:9092'],
      sourceName: '/cybermind/connector',
    }),
  ],
  controllers: [AppController, ConnectorController],
  providers: [
    AppService,
    ConnectorDomainService,
    ExecutionEngine,
    { provide: 'IConnectorRepository', useClass: ConnectorPrismaRepository },
  ],
})
export class AppModule {}
