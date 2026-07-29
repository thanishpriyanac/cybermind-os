import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';
import { AiController } from './ai.controller';
import { CopilotController } from './copilot.controller';
import { AiGatewayService } from '../gateway/ai-gateway.service';
import { SmartProviderRouter } from '../gateway/smart-router';
import { SemanticMemoryService } from '../memory/semantic-memory.service';
import { KnowledgeGraphService } from '../knowledge-graph/knowledge-graph.service';
import { KnowledgeCrawlerService } from '../crawler/knowledge-crawler.service';
import { ConsensusEngine } from '../consensus/consensus-engine';
import { OpenAIProvider } from '../providers/openai.provider';
import { AnthropicProvider } from '../providers/anthropic.provider';
import { OllamaProvider } from '../providers/ollama.provider';
import { LlmProvider, EmbeddingProvider } from '../providers/provider.interface';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AiController, CopilotController],
  providers: [
    PrismaService,

    // ── Provider Registry ──────────────────────────────────────────────────
    {
      provide: 'PROVIDER_MAP',
      useFactory: (): Map<string, LlmProvider> => {
        const map = new Map<string, LlmProvider>();
        // Always register Ollama (local, zero cost)
        map.set('ollama', new OllamaProvider());
        // Register cloud providers only if API keys are present
        if (process.env.OPENAI_API_KEY) {
          map.set('openai', new OpenAIProvider(process.env.OPENAI_API_KEY));
        }
        if (process.env.ANTHROPIC_API_KEY) {
          map.set('anthropic', new AnthropicProvider(process.env.ANTHROPIC_API_KEY));
        }
        return map;
      },
    },

    // ── Embedding Provider (OpenAI preferred, Ollama fallback) ─────────────
    {
      provide: 'EMBEDDING_PROVIDER',
      useFactory: (): EmbeddingProvider => {
        if (process.env.OPENAI_API_KEY) {
          return new OpenAIProvider(process.env.OPENAI_API_KEY);
        }
        return new OllamaProvider();
      },
    },

    // ── Router ─────────────────────────────────────────────────────────────
    {
      provide: SmartProviderRouter,
      useFactory: (providerMap: Map<string, LlmProvider>) => new SmartProviderRouter(providerMap),
      inject: ['PROVIDER_MAP'],
    },

    // ── Core Services ──────────────────────────────────────────────────────
    AiGatewayService,
    ConsensusEngine,

    {
      provide: SemanticMemoryService,
      useFactory: (prisma: PrismaService, embedder: EmbeddingProvider) =>
        new SemanticMemoryService(prisma, embedder),
      inject: [PrismaService, 'EMBEDDING_PROVIDER'],
    },
    {
      provide: KnowledgeGraphService,
      useFactory: (prisma: PrismaService, embedder: EmbeddingProvider) =>
        new KnowledgeGraphService(prisma, embedder),
      inject: [PrismaService, 'EMBEDDING_PROVIDER'],
    },

    KnowledgeCrawlerService,
  ],
})
export class AppModule {}
