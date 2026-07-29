export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmRequest {
  modelKey: string;
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LlmResponse {
  content: string;
  provider: string;
  modelKey: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
}

export interface LlmStreamChunk {
  delta: string;
  done: boolean;
}

/**
 * LlmProvider – core abstraction every provider adapter must implement.
 * The AI Gateway never calls provider SDKs directly; it always goes through this interface.
 */
export interface LlmProvider {
  readonly name: string;
  readonly supportedModels: string[];

  complete(request: LlmRequest): Promise<LlmResponse>;
  stream(request: LlmRequest): AsyncGenerator<LlmStreamChunk>;
  isHealthy(): Promise<boolean>;
}

export interface EmbeddingProvider {
  readonly name: string;
  embed(texts: string[]): Promise<number[][]>;
}
