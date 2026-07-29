import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { EmbeddingProvider } from '../providers/provider.interface';

const MEMORY_TYPES = ['SUMMARY', 'ENTITY', 'IOC', 'FINDING'] as const;

@Injectable()
export class SemanticMemoryService {
  private readonly logger = new Logger(SemanticMemoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingProvider: EmbeddingProvider,
  ) {}

  /**
   * Store a memory entry with its vector embedding.
   */
  async store(
    conversationId: string,
    tenantId: string,
    content: string,
    memoryType: typeof MEMORY_TYPES[number],
  ): Promise<void> {
    const [embedding] = await this.embeddingProvider.embed([content]);

    await this.prisma.$executeRaw`
      INSERT INTO "ConversationMemory" ("id", "conversationId", "tenantId", "content", "memoryType", "embedding", "createdAt")
      VALUES (
        gen_random_uuid(),
        ${conversationId},
        ${tenantId},
        ${content},
        ${memoryType},
        ${`[${embedding.join(',')}]`}::vector,
        now()
      )
    `;
  }

  /**
   * Search memories by semantic similarity.
   * Returns the top-k most relevant memories for the query.
   */
  async search(tenantId: string, query: string, topK = 5): Promise<string[]> {
    const [queryEmbedding] = await this.embeddingProvider.embed([query]);
    const vectorLiteral = `[${queryEmbedding.join(',')}]`;

    const results = await this.prisma.$queryRaw<{ content: string; distance: number }[]>`
      SELECT content, embedding <-> ${vectorLiteral}::vector AS distance
      FROM "ConversationMemory"
      WHERE "tenantId" = ${tenantId}
      ORDER BY distance ASC
      LIMIT ${topK}
    `;

    return results.map(r => r.content);
  }

  /**
   * Build a rolling summary of a conversation and store it as a SUMMARY memory.
   */
  async summarizeAndStore(
    conversationId: string,
    tenantId: string,
    recentMessages: { role: string; content: string }[],
  ): Promise<void> {
    // Simple extractive summary — AI-powered summarization can be added in Sprint 2
    const keyLines = recentMessages
      .filter(m => m.role === 'assistant')
      .map(m => m.content.slice(0, 200))
      .join(' | ');

    if (!keyLines.trim()) return;
    await this.store(conversationId, tenantId, `Summary: ${keyLines}`, 'SUMMARY');
    this.logger.debug(`Memory stored for conversation ${conversationId}`);
  }
}
