import { Logger } from '@nestjs/common';
import { LlmProvider, LlmRequest, LlmResponse, LlmStreamChunk, EmbeddingProvider } from './provider.interface';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';

export class OllamaProvider implements LlmProvider, EmbeddingProvider {
  readonly name = 'ollama';
  readonly supportedModels = ['llama3.1', 'qwen2.5-coder', 'mistral-nemo', 'nomic-embed-text'];
  private readonly logger = new Logger(OllamaProvider.name);

  async complete(request: LlmRequest): Promise<LlmResponse> {
    const start = Date.now();
    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.modelKey,
        messages: request.messages,
        stream: false,
        options: { temperature: request.temperature ?? 0.3, num_predict: request.maxTokens ?? 2048 },
      }),
    });

    if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
    const data: any = await response.json();

    return {
      content: data.message?.content ?? '',
      provider: this.name,
      modelKey: request.modelKey,
      inputTokens: data.prompt_eval_count ?? 0,
      outputTokens: data.eval_count ?? 0,
      latencyMs: Date.now() - start,
      costUsd: 0, // Local — zero cost
    };
  }

  async *stream(request: LlmRequest): AsyncGenerator<LlmStreamChunk> {
    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: request.modelKey, messages: request.messages, stream: true }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const chunk = JSON.parse(line);
          yield { delta: chunk.message?.content ?? '', done: chunk.done ?? false };
        } catch { /* skip malformed */ }
      }
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      const response = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'nomic-embed-text', prompt: text }),
      });
      const data: any = await response.json();
      embeddings.push(data.embedding);
    }
    return embeddings;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch(`${OLLAMA_BASE}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  }
}
