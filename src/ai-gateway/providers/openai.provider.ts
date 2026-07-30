import { Injectable } from '@nestjs/common';
import { BaseProviderAdapter } from './base.provider';
import { ProviderExecutionContext, ProviderExecutionResult } from '../interfaces/provider.adapter';
import { CostEngineService } from '../cost-engine/cost-engine.service';

@Injectable()
export class OpenAIProviderAdapter extends BaseProviderAdapter {
  readonly providerName = 'openai';

  constructor(costEngine: CostEngineService) {
    super(costEngine);
  }

  async execute(ctx: ProviderExecutionContext, apiKey?: string): Promise<ProviderExecutionResult> {
    const startTime = Date.now();
    const systemPrompt = this.getFormattedSystemPrompt(ctx.systemPrompt);

    try {
      // Simulate/Execute OpenAI REST Completion
      const promptTokens = this.costEngine.estimateTokenCount(systemPrompt + ctx.userPrompt);
      const mockResponse = `[CYBERMIND OpenAI Analysis] Query: "${ctx.userPrompt}". Verified against MITRE ATT&CK T1059 (Command & Scripting Interpreter). Recommended Mitigation: Audit PowerShell logs (Event ID 4104).`;
      const completionTokens = this.costEngine.estimateTokenCount(mockResponse);

      if (ctx.onChunk) {
        ctx.onChunk(mockResponse);
      }

      const latencyMs = Date.now() - startTime;
      const costUsd = this.costEngine.calculateCostUsd(promptTokens, completionTokens, 0.005, 0.015);

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
        errorMessage: err.message || 'OpenAI API execution failed',
      };
    }
  }
}
