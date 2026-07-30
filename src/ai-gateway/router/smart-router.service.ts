import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProviderExecutionContext, ProviderExecutionResult, IAIProviderAdapter } from '../interfaces/provider.adapter';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { KeyManagerService } from '../key-manager/key-manager.service';
import { OpenAIProviderAdapter } from '../providers/openai.provider';
import { AnthropicProviderAdapter, GeminiProviderAdapter, OllamaProviderAdapter } from '../providers/provider-adapters';

@Injectable()
export class SmartRouterService {
  private readonly logger = new Logger(SmartRouterService.name);
  private readonly adapters = new Map<string, IAIProviderAdapter>();

  constructor(
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly keyManager: KeyManagerService,
    openAiAdapter: OpenAIProviderAdapter,
    anthropicAdapter: AnthropicProviderAdapter,
    geminiAdapter: GeminiProviderAdapter,
    ollamaAdapter: OllamaProviderAdapter,
  ) {
    this.registerAdapter(openAiAdapter);
    this.registerAdapter(anthropicAdapter);
    this.registerAdapter(geminiAdapter);
    this.registerAdapter(ollamaAdapter);
  }

  private registerAdapter(adapter: IAIProviderAdapter) {
    this.adapters.set(adapter.providerName, adapter);
  }

  async executeProvider(ctx: ProviderExecutionContext): Promise<ProviderExecutionResult> {
    // 1. Verify Circuit Breaker State
    if (!this.circuitBreaker.canExecute(ctx.modelKey)) {
      this.logger.warn(`Circuit is OPEN for ${ctx.modelKey}. Blocking execution.`);
      return {
        provider: ctx.provider,
        modelKey: ctx.modelKey,
        responseText: '',
        promptTokens: 0,
        completionTokens: 0,
        latencyMs: 0,
        costUsd: 0,
        status: 'CIRCUIT_OPEN',
        errorMessage: `Provider ${ctx.provider} (${ctx.modelKey}) is currently unavailable due to repeated failures.`,
      };
    }

    // 2. Locate Adapter
    const adapter = this.adapters.get(ctx.provider);
    if (!adapter) {
      throw new NotFoundException(`No provider adapter registered for ${ctx.provider}`);
    }

    // 3. Fetch Decrypted API Key (unless local model like Ollama)
    let apiKey: string | undefined;
    if (ctx.provider !== 'ollama') {
      const key = await this.keyManager.getDecryptedKeyForProvider(ctx.provider);
      if (key) apiKey = key;
    }

    // 4. Execute Adapter Contract
    const result = await adapter.execute(ctx, apiKey);

    // 5. Update Circuit Breaker Metrics
    if (result.status === 'SUCCESS') {
      await this.circuitBreaker.recordSuccess(ctx.provider, ctx.modelKey);
    } else {
      await this.circuitBreaker.recordFailure(ctx.provider, ctx.modelKey, result.errorMessage || 'Execution failed');
    }

    return result;
  }
}
