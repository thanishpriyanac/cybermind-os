import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { LlmProvider, LlmRequest, LlmResponse, LlmStreamChunk, EmbeddingProvider } from './provider.interface';

const COST_TABLE: Record<string, { input: number; output: number }> = {
  'gpt-4o':            { input: 0.0025, output: 0.010 },
  'gpt-4o-mini':       { input: 0.00015, output: 0.0006 },
  'o3-mini':           { input: 0.0011, output: 0.0044 },
};

export class OpenAIProvider implements LlmProvider, EmbeddingProvider {
  readonly name = 'openai';
  readonly supportedModels = Object.keys(COST_TABLE);
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    const start = Date.now();
    const response = await this.client.chat.completions.create({
      model: request.modelKey,
      messages: request.messages,
      temperature: request.temperature ?? 0.3,
      max_tokens: request.maxTokens ?? 4096,
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
    const stream = await this.client.chat.completions.create({
      model: request.modelKey,
      messages: request.messages,
      temperature: request.temperature ?? 0.3,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      const done = chunk.choices[0]?.finish_reason === 'stop';
      yield { delta, done };
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });
    return response.data.map(d => d.embedding);
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
