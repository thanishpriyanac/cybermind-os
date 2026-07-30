import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingProvider } from './embedding.provider';

// A mock local provider just as an example of batching vs immediate
class OpenAIEmbeddingProvider implements EmbeddingProvider {
  async embed(texts: string[]): Promise<number[][]> {
    // In reality, calls OpenAI batch API. Here we just return mock vectors.
    return texts.map(() => Array(1536).fill(0.1));
  }
  getProviderName(): string { return 'openai'; }
  getModelName(): string { return 'text-embedding-3-small'; }
  getModelVersion(): string { return '1.0'; }
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private provider: EmbeddingProvider;

  constructor() {
    // Inject or select based on config. We'll default to OpenAI provider.
    this.provider = new OpenAIEmbeddingProvider();
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const vectors = await this.provider.embed([text]);
    return vectors[0];
  }

  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    return this.provider.embed(texts);
  }

  getProviderDetails() {
    return {
      provider: this.provider.getProviderName(),
      model: this.provider.getModelName(),
      version: this.provider.getModelVersion()
    };
  }
}
