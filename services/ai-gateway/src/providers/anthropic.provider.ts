import { Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { LlmProvider, LlmRequest, LlmResponse, LlmStreamChunk } from './provider.interface';

const COST_TABLE: Record<string, { input: number; output: number }> = {
  'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
  'claude-3-5-haiku-20241022':  { input: 0.0008, output: 0.004 },
  'claude-opus-4-5':            { input: 0.015, output: 0.075 },
};

export class AnthropicProvider implements LlmProvider {
  readonly name = 'anthropic';
  readonly supportedModels = Object.keys(COST_TABLE);
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    const start = Date.now();

    const systemMsg = request.messages.find(m => m.role === 'system')?.content;
    const userMessages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const response = await this.client.messages.create({
      model: request.modelKey,
      max_tokens: request.maxTokens ?? 4096,
      system: systemMsg,
      messages: userMessages,
    });

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const costs = COST_TABLE[request.modelKey] ?? { input: 0, output: 0 };
    const costUsd = (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;

    const content = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('');

    return { content, provider: this.name, modelKey: request.modelKey, inputTokens, outputTokens, latencyMs: Date.now() - start, costUsd };
  }

  async *stream(request: LlmRequest): AsyncGenerator<LlmStreamChunk> {
    const systemMsg = request.messages.find(m => m.role === 'system')?.content;
    const userMessages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const stream = this.client.messages.stream({
      model: request.modelKey,
      max_tokens: request.maxTokens ?? 4096,
      system: systemMsg,
      messages: userMessages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { delta: event.delta.text, done: false };
      }
      if (event.type === 'message_stop') {
        yield { delta: '', done: true };
      }
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}
