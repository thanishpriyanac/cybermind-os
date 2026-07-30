import { Injectable } from '@nestjs/common';
import { BaseProviderAdapter } from './base.provider';
import { ProviderExecutionContext, ProviderExecutionResult } from '../interfaces/provider.adapter';
import { CostEngineService } from '../cost-engine/cost-engine.service';

@Injectable()
export class AnthropicProviderAdapter extends BaseProviderAdapter {
  readonly providerName = 'anthropic';

  constructor(costEngine: CostEngineService) {
    super(costEngine);
  }

  async execute(ctx: ProviderExecutionContext, apiKey?: string): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const systemPrompt = this.getFormattedSystemPrompt(ctx.systemPrompt);

    try {
      const promptTokens = this.costEngine.estimateTokenCount(systemPrompt + ctx.userPrompt);
      const mockResponse = `[CYBERMIND Claude Analysis] Query: "${ctx.userPrompt}". Identified potential exploitation vector. Recommended Action: Review egress firewall rules for suspicious outbound C2 IPs.`;
      const completionTokens = this.costEngine.estimateTokenCount(mockResponse);

      if (ctx.onChunk) ctx.onChunk(mockResponse);

      const latencyMs = Date.now() - startTime;
      const costUsd = this.costEngine.calculateCostUsd(promptTokens, completionTokens, 0.003, 0.015);

      return {
        provider: this.providerName,
        modelKey: ctx.modelKey,
        responseText: mockResponse,
        promptTokens,
        completionTokens,
        latencyMs,
        costUsd,
        status: 'SUCCESS',
      };
    } catch (err: any) {
      return {
        provider: this.providerName,
        modelKey: ctx.modelKey,
        responseText: '',
        promptTokens: 0,
        completionTokens: 0,
        latencyMs: Date.now() - startTime,
        costUsd: 0,
        status: 'ERROR',
        errorMessage: err.message || 'Anthropic API execution failed',
      };
    }
  }
}

@Injectable()
export class GeminiProviderAdapter extends BaseProviderAdapter {
  readonly providerName = 'google';

  constructor(costEngine: CostEngineService) {
    super(costEngine);
  }

  async execute(ctx: ProviderExecutionContext, apiKey?: string): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const systemPrompt = this.getFormattedSystemPrompt(ctx.systemPrompt);

    try {
      const promptTokens = this.costEngine.estimateTokenCount(systemPrompt + ctx.userPrompt);
      const mockResponse = `[CYBERMIND Gemini Analysis] Query: "${ctx.userPrompt}". Verified vulnerability against CVE-2024-3094. Patch status: Update xz-utils immediately.`;
      const completionTokens = this.costEngine.estimateTokenCount(mockResponse);

      if (ctx.onChunk) ctx.onChunk(mockResponse);

      const latencyMs = Date.now() - startTime;
      const costUsd = this.costEngine.calculateCostUsd(promptTokens, completionTokens, 0.0035, 0.0105);

      return {
        provider: this.providerName,
        modelKey: ctx.modelKey,
        responseText: mockResponse,
        promptTokens,
        completionTokens,
        latencyMs,
        costUsd,
        status: 'SUCCESS',
      };
    } catch (err: any) {
      return {
        provider: this.providerName,
        modelKey: ctx.modelKey,
        responseText: '',
        promptTokens: 0,
        completionTokens: 0,
        latencyMs: Date.now() - startTime,
        costUsd: 0,
        status: 'ERROR',
        errorMessage: err.message || 'Gemini API execution failed',
      };
    }
  }
}

@Injectable()
export class OllamaProviderAdapter extends BaseProviderAdapter {
  readonly providerName = 'ollama';

  constructor(costEngine: CostEngineService) {
    super(costEngine);
  }

  async execute(ctx: ProviderExecutionContext, apiKey?: string): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const systemPrompt = this.getFormattedSystemPrompt(ctx.systemPrompt);

    try {
      const promptTokens = this.costEngine.estimateTokenCount(systemPrompt + ctx.userPrompt);
      const mockResponse = `[CYBERMIND Local Ollama Analysis] Local query processed with 0 API cost. Target analysis complete.`;
      const completionTokens = this.costEngine.estimateTokenCount(mockResponse);

      if (ctx.onChunk) ctx.onChunk(mockResponse);

      const latencyMs = Date.now() - startTime;
      const costUsd = 0; // Local model = $0 cost

      return {
        provider: this.providerName,
        modelKey: ctx.modelKey,
        responseText: mockResponse,
        promptTokens,
        completionTokens,
        latencyMs,
        costUsd,
        status: 'SUCCESS',
      };
    } catch (err: any) {
      return {
        provider: this.providerName,
        modelKey: ctx.modelKey,
        responseText: '',
        promptTokens: 0,
        completionTokens: 0,
        latencyMs: Date.now() - startTime,
        costUsd: 0,
        status: 'ERROR',
        errorMessage: err.message || 'Local Ollama execution failed',
      };
    }
  }
}
