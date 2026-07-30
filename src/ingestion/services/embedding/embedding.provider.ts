export interface EmbeddingProvider {
  /**
   * Generates embeddings for an array of strings.
   * Providers handles batching logic internally (e.g. OpenAI batches, Ollama processes serially or parallel).
   */
  embed(texts: string[]): Promise<number[][]>;
  
  getProviderName(): string;
  getModelName(): string;
  getModelVersion(): string;
}
