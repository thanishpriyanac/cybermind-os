import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { LlmProvider, LlmRequest, LlmResponse, LlmStreamChunk } from './provider.interface';

const COST_TABLE: Record<string, { input: number; output: number }> = {
  'deepseek-ai/deepseek-v4-flash': { input: 0.0001, output: 0.0001 },
  'deepseek-ai/deepseek-v4-pro': { input: 0.0005, output: 0.001 },
  'meta/llama-3.1-70b-instruct': { input: 0.0002, output: 0.0002 },
};

export class NvidiaProvider implements LlmProvider {
  readonly name = 'nvidia';
  readonly supportedModels = Object.keys(COST_TABLE);
  private readonly logger = new Logger(NvidiaProvider.name);
  private readonly client: OpenAI;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://integrate.api.nvidia.com/v1',
      });
    } else {
      this.logger.warn('NVIDIA_API_KEY is not set. NvidiaProvider will not be available.');
    }
  }

  private isFlashModel(model: string): boolean {
    return model.includes('flash');
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    if (!this.client) {
      throw new Error('Nvidia API key is not configured');
    }

    const start = Date.now();
    const isFlash = this.isFlashModel(request.modelKey);

    const response = await this.client.chat.completions.create({
      model: request.modelKey,
      messages: request.messages,
      temperature: request.temperature ?? 0.3,
      max_tokens: request.maxTokens ?? 16384,
      ...(isFlash ? { extra_body: { chat_template_kwargs: { thinking: true, reasoning_effort: "high" } } } : {}),
    });

    const inputTokens = response.usage?.prompt_tokens ?? 0;
    const outputTokens = response.usage?.completion_tokens ?? 0;
    const costs = COST_TABLE[request.modelKey] ?? { input: 0, output: 0 };
    const costUsd = (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;

    let content = response.choices[0].message.content ?? '';
    // Deepseek through NVIDIA puts reasoning in an extra field, we should append it to the content if it exists
    const reasoning = (response.choices[0].message as any).reasoning ?? (response.choices[0].message as any).reasoning_content;
    if (reasoning) {
      content = `> **Reasoning Process**\n> \n> ${reasoning.split('\n').join('\n> ')}\n\n${content}`;
    }

    return {
      content,
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
      throw new Error('Nvidia API key is not configured');
    }

    const isFlash = this.isFlashModel(request.modelKey);

    const stream = await this.client.chat.completions.create({
      model: request.modelKey,
      messages: request.messages,
      temperature: request.temperature ?? 0.3,
      stream: true,
      max_tokens: request.maxTokens ?? 16384,
      ...(isFlash ? { extra_body: { chat_template_kwargs: { thinking: true, reasoning_effort: "high" } } } : {}),
    });

    let reasoningFinished = false;

    for await (const chunk of stream) {
      const deltaContent = chunk.choices[0]?.delta?.content ?? '';
      const reasoningDelta = (chunk.choices[0]?.delta as any)?.reasoning ?? (chunk.choices[0]?.delta as any)?.reasoning_content ?? '';
      
      let delta = '';

      if (reasoningDelta) {
        if (!reasoningFinished) {
          delta = `> ${reasoningDelta}`;
        }
      } else if (deltaContent) {
        if (!reasoningFinished && isFlash) {
          reasoningFinished = true;
          delta = `\n\n${deltaContent}`;
        } else {
          delta = deltaContent;
        }
      }

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
