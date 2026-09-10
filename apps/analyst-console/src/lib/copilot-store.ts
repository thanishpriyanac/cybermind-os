import fs from 'fs';
import path from 'path';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: {
    model?: string;
    provider?: string;
    confidence?: number;
    latencyMs?: number;
    traceId?: string;
  };
}

export interface CopilotConversation {
  id: string;
  title: string;
  model: string;
  modelKey: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  tenantId: string;
  userId: string;
  messages: CopilotMessage[];
}

import { getDataFilePath, writeJsonAtomic } from './atomic-store';

function getStoreFilePath(): string {
  return getDataFilePath('copilot_store.json');
}

// Default store is empty — seeded conversations were visible to ALL users (privacy bug)
const DEFAULT_CONVERSATIONS: CopilotConversation[] = [];

let inMemoryStore: CopilotConversation[] | null = null;

function loadStore(): CopilotConversation[] {
  if (inMemoryStore) return inMemoryStore;

  try {
    const file = getStoreFilePath();
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      inMemoryStore = JSON.parse(raw);
      return inMemoryStore!;
    }
  } catch (err) {
    console.error('Failed to read copilot store file, using defaults', err);
  }

  inMemoryStore = [...DEFAULT_CONVERSATIONS];
  saveStore(inMemoryStore);
  return inMemoryStore;
}

function saveStore(store: CopilotConversation[]) {
  inMemoryStore = store;
  try {
    const file = getStoreFilePath();
    writeJsonAtomic(file, store);
  } catch (err) {
    console.error('Failed to write copilot store file', err);
  }
}

export const copilotStore = {
  getConversations(tenantId?: string, userId?: string) {
    const store = loadStore();
    return store
      .filter((conv) => {
        // STRICT user isolation: each user only sees their own conversations
        if (userId && conv.userId && conv.userId !== userId) return false;
        if (tenantId && conv.tenantId && conv.tenantId !== tenantId) return false;
        return true;
      })
      .map((conv) => ({
        id: conv.id,
        title: conv.title,
        model: conv.model,
        modelKey: conv.modelKey,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        lastMessageAt: conv.lastMessageAt,
        messageCount: conv.messages.length,
        userId: conv.userId,
      }));
  },

  getConversation(id: string, tenantId?: string, userId?: string) {
    const store = loadStore();
    const conv = store.find((c) => c.id === id);
    if (!conv) return null;
    // Strict user isolation on read too
    if (userId && conv.userId && conv.userId !== userId) return null;
    if (tenantId && conv.tenantId && conv.tenantId !== tenantId) return null;
    return conv;
  },

  getMessages(conversationId: string, tenantId?: string, userId?: string): CopilotMessage[] {
    const conv = this.getConversation(conversationId, tenantId, userId);
    return conv ? conv.messages : [];
  },

  createConversation(params: {
    id?: string;
    title?: string;
    model?: string;
    modelKey?: string;
    tenantId?: string;
    userId?: string;
  }): CopilotConversation {
    const store = loadStore();
    const id = params.id || `conv-${Date.now()}`;
    const existing = store.find((c) => c.id === id);
    if (existing) return existing;

    const now = new Date().toISOString();
    const newConv: CopilotConversation = {
      id,
      title: params.title || 'New Security Analysis',
      model: params.model || 'Auto (Smart Router)',
      modelKey: params.modelKey || 'auto',
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      tenantId: params.tenantId || 'cybermind-master-tenant',
      userId: params.userId || 'admin@cybermind.local',
      messages: [],
    };

    store.unshift(newConv);
    saveStore(store);
    return newConv;
  },

  addMessage(
    conversationId: string,
    message: {
      role: 'user' | 'assistant' | 'system';
      content: string;
      metadata?: any;
    },
    options?: {
      titleIfFirst?: string;
      model?: string;
      modelKey?: string;
      tenantId?: string;
      userId?: string;
    }
  ): CopilotMessage {
    const store = loadStore();
    let conv = store.find((c) => c.id === conversationId);

    if (!conv) {
      conv = this.createConversation({
        id: conversationId,
        title: options?.titleIfFirst,
        model: options?.model,
        modelKey: options?.modelKey,
        tenantId: options?.tenantId,
        userId: options?.userId,
      });
    }

    const now = new Date().toISOString();
    const newMessage: CopilotMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: message.role,
      content: message.content,
      createdAt: now,
      metadata: message.metadata,
    };

    conv.messages.push(newMessage);
    conv.updatedAt = now;
    conv.lastMessageAt = now;

    if (conv.messages.length === 1 && message.role === 'user') {
      const summaryTitle = message.content.slice(0, 36).trim();
      conv.title = summaryTitle.length < message.content.length ? `${summaryTitle}...` : summaryTitle;
    }

    saveStore(store);
    return newMessage;
  },

  deleteConversation(id: string, tenantId?: string, userId?: string): boolean {
    const store = loadStore();
    const index = store.findIndex((c) => {
      if (c.id !== id) return false;
      if (tenantId && c.tenantId && c.tenantId !== tenantId) return false;
      if (userId && c.userId && c.userId !== userId) return false;
      return true;
    });
    if (index !== -1) {
      store.splice(index, 1);
      saveStore(store);
      return true;
    }
    return false;
  },
};
