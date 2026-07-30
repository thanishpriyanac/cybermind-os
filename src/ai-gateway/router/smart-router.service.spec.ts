import { Test, TestingModule } from '@nestjs/testing';
import { SmartRouterService } from './smart-router.service';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { KeyManagerService } from '../key-manager/key-manager.service';
import { OpenAIProviderAdapter } from '../providers/openai.provider';
import { AnthropicProviderAdapter, GeminiProviderAdapter, OllamaProviderAdapter } from '../providers/provider-adapters';
import { CostEngineService } from '../cost-engine/cost-engine.service';
import { ProviderExecutionContext } from '../interfaces/provider.adapter';

describe('SmartRouterService', () => {
  let router: SmartRouterService;
  let circuitBreaker: CircuitBreakerService;

  beforeEach(async () => {
    const mockCircuitBreaker = {
      canExecute: jest.fn().mockReturnValue(true),
      recordSuccess: jest.fn().mockResolvedValue({}),
      recordFailure: jest.fn().mockResolvedValue({}),
    };

    const mockKeyManager = {
      getDecryptedKeyForProvider: jest.fn().mockResolvedValue('sk-mock-key-12345'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmartRouterService,
        CostEngineService,
        OpenAIProviderAdapter,
        AnthropicProviderAdapter,
        GeminiProviderAdapter,
        OllamaProviderAdapter,
        { provide: CircuitBreakerService, useValue: mockCircuitBreaker },
        { provide: KeyManagerService, useValue: mockKeyManager },
      ],
    }).compile();

    router = module.get<SmartRouterService>(SmartRouterService);
    circuitBreaker = module.get<CircuitBreakerService>(CircuitBreakerService);
  });

  it('should be defined', () => {
    expect(router).toBeDefined();
  });

  it('should execute provider request successfully', async () => {
    const ctx: ProviderExecutionContext = {
      conversationId: 'conv-123',
      turnId: 'turn-456',
      provider: 'openai',
      modelKey: 'gpt-4o',
      systemPrompt: 'System rule',
      userPrompt: 'Explain CVE-2024-3094',
    };

    const result = await router.executeProvider(ctx);

    expect(result.status).toEqual('SUCCESS');
    expect(result.provider).toEqual('openai');
    expect(result.responseText).toContain('CYBERMIND OpenAI Analysis');
    expect(circuitBreaker.recordSuccess).toHaveBeenCalledWith('openai', 'gpt-4o');
  });

  it('should block execution when Circuit Breaker is open', async () => {
    (circuitBreaker.canExecute as jest.Mock).mockReturnValue(false);

    const ctx: ProviderExecutionContext = {
      conversationId: 'conv-123',
      turnId: 'turn-456',
      provider: 'openai',
      modelKey: 'gpt-4o',
      systemPrompt: 'System rule',
      userPrompt: 'Explain CVE-2024-3094',
    };

    const result = await router.executeProvider(ctx);

    expect(result.status).toEqual('CIRCUIT_OPEN');
    expect(result.responseText).toEqual('');
  });
});
