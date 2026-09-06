import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { LlmProvider, LlmRequest, LlmResponse, LlmStreamChunk } from './provider.interface';

const COST_TABLE: Record<string, { input: number; output: number }> = {
  'grok-2-1212': { input: 0.002, output: 0.010 },
  'grok-2-vision-1212': { input: 0.002, output: 0.010 },
};

export class XaiProvider implements LlmProvider {
  readonly name = 'xai';
  readonly supportedModels = Object.keys(COST_TABLE);
  private readonly logger = new Logger(XaiProvider.name);
  private readonly client: OpenAI;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://api.x.ai/v1',
      });
    } else {
      this.logger.warn('XAI_API_KEY is not set. XaiProvider will not be available.');
    }
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    if (!this.client) {
      throw new Error('xAI API key is not configured');
    }

    const start = Date.now();

    const response = await this.client.chat.completions.create({
      model: request.modelKey,
      messages: request.messages,
      temperature: request.temperature ?? 0.3,
      max_tokens: request.maxTokens ?? 8192,
    });

    const inputTokens = response.usage?.prompt_tokens ?? 0;
    const outputTokens = response.usage?.completion_tokens ?? 0;
    const costs = COST_TABLE[request.modelKey] ?? { input: 0, output: 0 };
    const costUsd = (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;

    return {
      content: response.choices[0].message.content ?? '',
      provider: this.name,
      modelKey: request.modelKey,
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - start,
      costUsd,
    };
  }

  async *stream(request: LlmRequest): AsyncGenerator<LlmStreamChunk> {
    if (!this.client) {
      throw new Error('xAI API key is not configured');
    }

    const stream = await this.client.chat.completions.create({
      model: request.modelKey,
      messages: request.messages,
      temperature: request.temperature ?? 0.3,
      stream: true,
      max_tokens: request.maxTokens ?? 8192,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      const done = chunk.choices[0]?.finish_reason === 'stop';
      yield { delta, done };
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}
