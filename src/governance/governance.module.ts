import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { ReviewQueueService } from './services/review-queue.service';
import { GraphCurationService } from './services/graph-curation.service';
import { DatasetExportService } from './services/dataset-export.service';
import { StixExportService } from './services/stix-export.service';
import { DatasetExportController } from './dataset-export.controller';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [DatasetExportController],
  providers: [ReviewQueueService, GraphCurationService, DatasetExportService, StixExportService],
  exports: [ReviewQueueService, GraphCurationService, DatasetExportService, StixExportService],
})
export class GovernanceModule {}
