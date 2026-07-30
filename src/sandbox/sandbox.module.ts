import { Module } from '@nestjs/common';
import { SandboxController } from './sandbox.controller';
import { LocalObjectStorageService } from './services/object-storage.service';
import { FileIdentificationService } from './services/file-identification.service';
import { StaticAnalysisService } from './services/static-analysis.service';
import { IocExtractionService } from './services/ioc-extraction.service';
import { InvestigationReportService } from './services/investigation-report.service';
import { SoarTemplateEngine } from './services/soar-template.engine';
import { SoarPlaybookService } from './services/soar-playbook.service';
import { EventsModule } from '../events/events.module';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [EventsModule, RetrievalModule, AiGatewayModule, PrismaModule],
  controllers: [SandboxController],
  providers: [
    LocalObjectStorageService,
    FileIdentificationService,
    StaticAnalysisService,
    IocExtractionService,
    InvestigationReportService,
    SoarTemplateEngine,
    SoarPlaybookService
  ],
})
export class SandboxModule {}
