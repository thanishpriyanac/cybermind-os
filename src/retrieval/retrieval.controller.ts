import { Controller, Get, Query, Post, Body, Param, UseGuards } from '@nestjs/common';
import { QueryAnalysisService } from './services/query-analysis.service';
import { KeywordSearchService } from './services/keyword-search.service';
import { VectorSearchService } from './services/vector-search.service';
import { GraphTraversalService } from './services/graph-traversal.service';
import { HybridRankerService } from './services/hybrid-ranker.service';
import { ContextBuilderService } from './services/context-builder.service';
import { SmartRouterService } from '../ai-gateway/router/smart-router.service';
import { ChatToGraphService } from './services/chat-to-graph.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { randomUUID } from 'crypto';

@Controller('api/retrieval')
@UseGuards(JwtAuthGuard)
export class RetrievalController {
  constructor(
    private readonly queryAnalysis: QueryAnalysisService,
    private readonly keywordSearch: KeywordSearchService,
    private readonly vectorSearch: VectorSearchService,
    private readonly graphTraversal: GraphTraversalService,
    private readonly ranker: HybridRankerService,
    private readonly contextBuilder: ContextBuilderService,
    private readonly smartRouter: SmartRouterService,
    private readonly chatToGraph: ChatToGraphService
  ) {}

  @Get('search')
  async search(@Query('q') query: string) {
    const analysis = await this.queryAnalysis.analyzeQuery(query);
    
    const [keywordHits, vectorHits] = await Promise.all([
      analysis.isKeywordHeavy ? this.keywordSearch.search(query) : Promise.resolve([]),
      analysis.isSemantic ? this.vectorSearch.search(query) : Promise.resolve([])
    ]);

    const graphHits = analysis.isGraphExploration 
      ? await this.graphTraversal.expand([...keywordHits, ...vectorHits], 1)
      : [];

    const rankedHits = this.ranker.rank(keywordHits, vectorHits, graphHits);
    return rankedHits;
  }

  @Post('ask')
  async ask(@Body('query') query: string) {
    // 1. Retrieve
    const rankedHits = await this.search(query);

    // 2. Build Context
    // Suppose our selected model has an 8k token limit
    const context = this.contextBuilder.buildContext(rankedHits, 8000);

    // 3. Synthesize via AI Gateway
    const systemPrompt = `You are a Cyber Threat Intelligence analyst. Answer the user's question using ONLY the provided retrieved intelligence context. If the answer is not in the context, say so. Cite your sources.
    
    ${context}`;

    const result = await this.smartRouter.executeProvider({
      conversationId: randomUUID(),
      turnId: randomUUID(),
      provider: 'openai',
      modelKey: 'gpt-4o',
      systemPrompt,
      userPrompt: query,
      onChunk: async () => {},
    });

    return {
      answer: result.responseText,
      sources: rankedHits.slice(0, 5).map(h => ({
        id: h.id,
        type: h.type,
        label: h.metadata.title || h.metadata.label,
        score: h.score,
        provenance: h.metadata.provenance || h.metadata.source
      }))
    };
  }
}
