import { Test, TestingModule } from '@nestjs/testing';
import { FanOutOrchestratorService } from './fanout-orchestrator.service';
import { PrismaService } from '../prisma/prisma.service';
import { SmartRouterService } from '../ai-gateway/router/smart-router.service';
import { ProviderModelRepository } from '../ai-gateway/repositories/provider-model.repository';
import { RedisPubSubService } from '../events/redis-pubsub.service';
import { ConsensusService } from './consensus.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { FanOutMode } from './dto/fanout.dto';

describe('FanOutOrchestratorService', () => {
  let service: FanOutOrchestratorService;
  let prismaService: any;
  let smartRouter: any;
  let modelRepo: any;
  let pubsub: any;
  let consensusService: any;

  beforeEach(async () => {
    prismaService = {
      conversationTurn: {
        create: jest.fn().mockResolvedValue({ id: 'turn-123' }),
      },
      aIResponse: {
        create: jest.fn().mockResolvedValue({ id: 'resp-1' }),
      },
    };

    smartRouter = {
      executeProvider: jest.fn().mockResolvedValue({
        provider: 'openai',
        modelKey: 'gpt-4o',
        responseText: 'Sample AI response',
        promptTokens: 10,
        completionTokens: 20,
        latencyMs: 150,
        costUsd: 0.001,
        status: 'SUCCESS',
      }),
    };

    modelRepo = {
      findActive: jest.fn().mockResolvedValue([
        { provider: 'openai', modelKey: 'gpt-4o' },
        { provider: 'anthropic', modelKey: 'claude-3-5-sonnet' },
      ]),
    };

    pubsub = {
      publish: jest.fn().mockResolvedValue(1),
    };

    consensusService = {
      generateConsensusSummary: jest.fn().mockResolvedValue('Consensus Summary Text'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FanOutOrchestratorService,
        { provide: PrismaService, useValue: prismaService },
        { provide: SmartRouterService, useValue: smartRouter },
        { provide: ProviderModelRepository, useValue: modelRepo },
        { provide: RedisPubSubService, useValue: pubsub },
        { provide: DomainEventBusService, useValue: { publish: jest.fn(), subscribe: jest.fn() } },
        { provide: ConsensusService, useValue: consensusService },
      ],
    }).compile();

    service = module.get<FanOutOrchestratorService>(FanOutOrchestratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should dispatch turn and trigger provider execution in Smart Mode', async () => {
    const result = await service.dispatchTurn('conv-999', {
      promptText: 'Analyze attack vector',
      mode: FanOutMode.SMART,
    });

    expect(result.turnId).toEqual('turn-123');
    expect(prismaService.conversationTurn.create).toHaveBeenCalled();
    expect(pubsub.publish).toHaveBeenCalled();
  });
});
