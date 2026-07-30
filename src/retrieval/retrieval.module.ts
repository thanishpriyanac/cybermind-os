import { Module } from '@nestjs/common';
import { RetrievalController } from './retrieval.controller';
import { QueryAnalysisService } from './services/query-analysis.service';
import { KeywordSearchService } from './services/keyword-search.service';
import { VectorSearchService } from './services/vector-search.service';
import { GraphTraversalService } from './services/graph-traversal.service';
import { HybridRankerService } from './services/hybrid-ranker.service';
import { ContextBuilderService } from './services/context-builder.service';
import { ChatToGraphService } from './services/chat-to-graph.service';
import { IntentParserService } from './services/intent-parser.service';
import { GraphQueryBuilderService } from './services/graph-query-builder.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { IngestionModule } from '../ingestion/ingestion.module';

@Module({
  imports: [PrismaModule, AiGatewayModule, IngestionModule],
  controllers: [RetrievalController],
  providers: [
    QueryAnalysisService,
    KeywordSearchService,
    VectorSearchService,
    GraphTraversalService,
    HybridRankerService,
    ContextBuilderService,
    ChatToGraphService,
    IntentParserService,
    GraphQueryBuilderService,
    GraphQueryBuilderService,
  ],
  exports: [ChatToGraphService],
})
export class RetrievalModule {}
