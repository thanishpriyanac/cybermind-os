export interface ProviderExecutionContext {
  conversationId: string;
  turnId: string;
  provider: string;
  modelKey: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  onChunk?: (chunkText: string) => void;
}

export interface ProviderExecutionResult {
  provider: string;
  modelKey: string;
  responseText: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  costUsd: number;
  status: 'SUCCESS' | 'TIMEOUT' | 'ERROR' | 'CIRCUIT_OPEN';
  errorMessage?: string;
}

export interface IAIProviderAdapter {
  readonly providerName: string;
  execute(ctx: ProviderExecutionContext, apiKey?: string): Promise<ProviderExecutionResult>;
}
