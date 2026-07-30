import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmartRouterService } from '../ai-gateway/router/smart-router.service';
import { ProviderModelRepository } from '../ai-gateway/repositories/provider-model.repository';
import { RedisPubSubService } from '../events/redis-pubsub.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { DomainEvents } from '../events/domain-events.registry';
import { randomUUID } from 'crypto';
import { ConsensusService, ProviderResponseSnippet } from './consensus.service';
import { CreateTurnDto, FanOutMode } from './dto/fanout.dto';

@Injectable()
export class FanOutOrchestratorService {
  private readonly logger = new Logger(FanOutOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smartRouter: SmartRouterService,
    private readonly modelRepo: ProviderModelRepository,
    private readonly pubsub: RedisPubSubService,
    private readonly eventBus: DomainEventBusService,
    private readonly consensusService: ConsensusService,
  ) {}

  async dispatchTurn(conversationId: string, dto: CreateTurnDto) {
    // 1. Create ConversationTurn in DB
    const turn = await this.prisma.conversationTurn.create({
      data: {
        conversationId,
        promptText: dto.promptText,
        mode: dto.mode,
      },
    });

    // 2. Select Models based on Mode
    let targetModels = await this.modelRepo.findActive();
    if (dto.mode === FanOutMode.SMART && (!dto.overrideModels || dto.overrideModels.length === 0)) {
      // Smart Mode defaults to top active model (e.g. gpt-4o)
      targetModels = targetModels.slice(0, 1);
    } else if (dto.overrideModels && dto.overrideModels.length > 0) {
      targetModels = targetModels.filter((m) => dto.overrideModels!.includes(m.modelKey));
    }

    this.logger.log(`Dispatching Turn ${turn.id} across ${targetModels.length} providers (Mode: ${dto.mode})`);

    const channel = `conversation:${conversationId}:stream`;

    // 3. Parallel Async Execution Engine
    const responses: ProviderResponseSnippet[] = [];

    const executionPromises = targetModels.map(async (model) => {
      const provider = model.provider;
      const modelKey = model.modelKey;

      // Event: Provider Started
      await this.pubsub.publish(channel, {
        event: 'provider_started',
        data: { turnId: turn.id, provider, modelKey },
      });

      const result = await this.smartRouter.executeProvider({
        conversationId,
        turnId: turn.id,
        provider,
        modelKey,
        systemPrompt: '',
        userPrompt: dto.promptText,
        onChunk: async (chunkText) => {
          await this.pubsub.publish(channel, {
            event: 'provider_chunk',
            data: { turnId: turn.id, provider, modelKey, chunk: chunkText },
          });
        },
      });

      // Save AI Response in DB
      await this.prisma.aIResponse.create({
        data: {
          turnId: turn.id,
          provider: result.provider,
          modelKey: result.modelKey,
          responseText: result.responseText,
          status: result.status,
          latencyMs: result.latencyMs,
          costUsd: result.costUsd,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
        },
      });

      if (result.status === 'SUCCESS') {
        responses.push({ provider, modelKey, responseText: result.responseText });
        await this.pubsub.publish(channel, {
          event: 'provider_finished',
          data: { turnId: turn.id, provider, modelKey, latencyMs: result.latencyMs, costUsd: result.costUsd },
        });
        
        await this.eventBus.publish({
          eventId: randomUUID(),
          eventType: DomainEvents.ProviderFinished,
          occurredAt: new Date().toISOString(),
          version: 1,
          correlationId: turn.id,
          traceId: randomUUID(),
          source: 'FanOutOrchestrator',
          conversationId,
          turnId: turn.id,
          payload: { provider, modelKey, latencyMs: result.latencyMs, costUsd: result.costUsd },
        });
      } else {
        await this.pubsub.publish(channel, {
          event: 'provider_error',
          data: { turnId: turn.id, provider, modelKey, error: result.errorMessage },
        });
        
        await this.eventBus.publish({
          eventId: randomUUID(),
          eventType: DomainEvents.ProviderError,
          occurredAt: new Date().toISOString(),
          version: 1,
          correlationId: turn.id,
          traceId: randomUUID(),
          source: 'FanOutOrchestrator',
          conversationId,
          turnId: turn.id,
          payload: { provider, modelKey, error: result.errorMessage },
        });
      }
    });

    // Fire non-blocking execution & consensus trigger
    Promise.allSettled(executionPromises).then(async () => {
      const consensusSummary = await this.consensusService.generateConsensusSummary(turn.id, responses);
      await this.pubsub.publish(channel, {
        event: 'consensus_ready',
        data: { turnId: turn.id, consensusSummary },
      });
      
      await this.eventBus.publish({
        eventId: randomUUID(),
        eventType: DomainEvents.ConsensusGenerated,
        occurredAt: new Date().toISOString(),
        version: 1,
        correlationId: turn.id,
        traceId: randomUUID(),
        source: 'FanOutOrchestrator',
        conversationId,
        turnId: turn.id,
        payload: { consensusSummary },
      });
      this.logger.log(`Turn ${turn.id} complete. All responses & consensus ready.`);
    });

    return {
      turnId: turn.id,
      conversationId,
      dispatchedProviders: targetModels.map((m) => m.modelKey),
      streamChannel: channel,
    };
  }
}
