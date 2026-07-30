import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AiGatewayModule } from './ai-gateway/ai-gateway.module';
import { FanOutModule } from './fanout/fanout.module';
import { EventsModule } from './events/events.module';
import { AuditModule } from './workers/audit/audit.module';
import { MemoryModule } from './workers/memory/memory.module';
import { KnowledgeGraphModule } from './workers/knowledge-graph/knowledge-graph.module';
import { AnalyticsModule } from './workers/analytics/analytics.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { RetrievalModule } from './retrieval/retrieval.module';
import { GovernanceModule } from './governance/governance.module';
import { SandboxModule } from './sandbox/sandbox.module';
import { HealthController } from './health/health.controller';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    EventsModule,
    AiGatewayModule,
    FanOutModule,
    AuditModule,
    MemoryModule,
    KnowledgeGraphModule,
    AnalyticsModule,
    IngestionModule,
    RetrievalModule,
    GovernanceModule,
    SandboxModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
