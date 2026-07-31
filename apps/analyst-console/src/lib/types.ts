// Shared types for the chat module
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  model?: string;
  provider?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface ChatRequest {
  message: string;
  conversationId?: string | null;
  systemPrompt?: string;
}

export interface StreamChunk {
  type: 'token' | 'done' | 'error' | 'conversation_id';
  content?: string;
  conversationId?: string;
  error?: string;
}
