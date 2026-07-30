import { Module } from '@nestjs/common';
import { NvdConnector } from './connectors/nvd.connector';
import { CisaKevConnector } from './connectors/cisa-kev.connector';
import { DocumentProcessorService } from './services/document-processor.service';
import { AiExtractorService } from './services/ai-extractor.service';
import { EmbeddingService } from './services/embedding/embedding.service';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';

@Module({
  imports: [AiGatewayModule],
  providers: [
    NvdConnector,
    CisaKevConnector,
    DocumentProcessorService,
    AiExtractorService,
    EmbeddingService,
  ],
  exports: [DocumentProcessorService, EmbeddingService],
})
export class IngestionModule {}
