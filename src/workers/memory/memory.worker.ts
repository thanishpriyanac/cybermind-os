import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { randomUUID } from 'crypto';
import { DomainWorker } from '../../events/domain-worker.interface';
import { DomainEvent } from '../../events/domain-event.interface';
import { DomainEvents } from '../../events/domain-events.registry';
import { PrismaService } from '../../prisma/prisma.service';
import { SmartRouterService } from '../../ai-gateway/router/smart-router.service';
import { DomainEventBusService } from '../../events/domain-event-bus.service';

@Processor('domain.memory', {
  concurrency: 2,
})
export class MemoryWorker extends WorkerHost implements DomainWorker {
  private readonly logger = new Logger(MemoryWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smartRouter: SmartRouterService,
    private readonly eventBus: DomainEventBusService,
  ) {
    super();
  }

  workerName(): string {
    return 'MemoryWorker';
  }

  supports(eventType: string): boolean {
    return (
      eventType === DomainEvents.ConsensusGenerated ||
      eventType === DomainEvents.ConversationCompleted
    );
  }

  async process(job: Job<DomainEvent<any>>): Promise<void> {
    const event = job.data;
    
    // 120s timeout for memory extraction
    await Promise.race([
      this.processEvent(event),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MemoryWorker Timeout')), 120000)),
    ]);
  }

  async processEvent(event: DomainEvent<any>): Promise<void> {
    if (!this.supports(event.eventType)) {
      return;
    }

    if (!event.conversationId) {
      this.logger.warn(`[${this.workerName()}] Ignored event ${event.eventId} due to missing conversationId`);
      return;
    }

    try {
      // 1. Fetch conversation context (turns)
      const turns = await this.prisma.conversationTurn.findMany({
        where: { conversationId: event.conversationId },
        orderBy: { createdAt: 'asc' },
      });

      if (turns.length === 0) return;

      const conversationText = turns.map(t => `User: ${t.promptText}\nAI: ${t.consensusSummary || ''}`).join('\n\n');

      // 2. Call AI Gateway for structured extraction
      const systemPrompt = `You are a cybersecurity memory extraction unit. 
Analyze the following conversation and return a JSON object with this exact schema:
{
  "summary": "string",
  "risk": "HIGH|MEDIUM|LOW|INFO",
  "entities": ["string"],
  "technologies": ["string"],
  "malware": ["string"],
  "cves": ["string"],
  "mitre": ["string"],
  "ioc": ["string"],
  "recommendations": ["string"]
}
Do not return any markdown or markdown code blocks. Just valid JSON.`;

      const aiResult = await this.smartRouter.executeProvider({
        conversationId: event.conversationId,
        turnId: event.turnId || randomUUID(), // Memory extraction isn't strictly tied to a user turn, but we need an ID for AI Gateway
        provider: 'openai', // Default to a strong provider or router logic
        modelKey: 'gpt-4o', // Should ideally be configured, hardcoding for now as it's typically the top model
        systemPrompt,
        userPrompt: conversationText,
        onChunk: async () => {}, // no streaming needed for offline processing
      });

      if (aiResult.status !== 'SUCCESS') {
        throw new Error(`AI extraction failed: ${aiResult.errorMessage}`);
      }

      // Parse JSON
      const jsonString = aiResult.responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const extractedData = JSON.parse(jsonString);

      // 3. Save to SemanticMemory (upsert based on conversationId)
      // Prisma doesn't support easy upsert on non-unique (conversationId is not unique in schema, wait let's check)
      // Actually `conversationId` is not `@unique` in `SemanticMemory`. A conversation can have multiple memories over time.
      // We will just create a new memory snapshot.
      
      const memory = await this.prisma.semanticMemory.create({
        data: {
          conversationId: event.conversationId,
          summaryText: JSON.stringify(extractedData),
          // embedding: unsupported in Prisma directly like this without raw query
        },
      });

      this.logger.log(`[${this.workerName()}] Processed memory for conversation ${event.conversationId}`);

      // 4. Emit EntityExtracted event
      await this.eventBus.publish({
        eventId: randomUUID(),
        eventType: DomainEvents.EntityExtracted,
        occurredAt: new Date().toISOString(),
        version: 1,
        correlationId: event.correlationId,
        traceId: event.traceId,
        source: this.workerName(),
        conversationId: event.conversationId,
        payload: {
          memoryId: memory.id,
          extractedData
        },
      });
      
    } catch (err) {
      this.logger.error(`[${this.workerName()}] Failed to process memory for event ${event.eventId}: ${(err as Error).message}`, (err as Error).stack);
      throw err;
    }
  }
}
