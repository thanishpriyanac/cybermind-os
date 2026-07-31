'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ConversationList } from '../../components/chat/conversation-list';
import { MessageList } from '../../components/chat/message-list';
import { ChatInput } from '../../components/chat/chat-input';
import { fetchConversations, fetchConversation, streamChat } from '../../lib/chat-api';
import { Message, Conversation } from '../../lib/types';

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('security');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch conversation list
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    refetchInterval: 30000,
    retry: false,
  });

  // Load conversation messages when switching
  const loadConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    setError(null);
    try {
      const conv = await fetchConversation(id);
      setMessages(conv.messages ?? []);
    } catch {
      setMessages([]);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
    setStreamingContent('');
  }, []);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    // Save whatever was streamed so far
    if (streamingContent) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: streamingContent + ' *(generation stopped)*',
          createdAt: new Date().toISOString(),
        },
      ]);
      setStreamingContent('');
    }
  }, [streamingContent]);

  const sendMessage = useCallback(
    async (userMessage: string, isRegenerate = false) => {
      setError(null);

      // Add user message to UI immediately
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userMessage,
        createdAt: new Date().toISOString(),
      };

      if (!isRegenerate) {
        setMessages((prev) => [...prev, userMsg]);
      }

      setIsStreaming(true);
      setStreamingContent('');

      const controller = new AbortController();
      abortControllerRef.current = controller;

      let accumulatedContent = '';
      let resolvedConversationId = activeConversationId;

      try {
        const stream = streamChat(
          userMessage,
          activeConversationId,
          systemPrompt,
          controller.signal
        );

        for await (const chunk of stream) {
          if (chunk.type === 'conversation_id' && chunk.conversationId) {
            resolvedConversationId = chunk.conversationId;
            setActiveConversationId(chunk.conversationId);
          } else if (chunk.type === 'token' && chunk.content) {
            accumulatedContent += chunk.content;
            setStreamingContent(accumulatedContent);
          } else if (chunk.type === 'error') {
            throw new Error(chunk.error ?? 'Unknown error from AI service');
          }
        }

        // Streaming done — commit to messages
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: accumulatedContent,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent('');

        // Refresh conversations list to show new/updated conversation
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        const message =
          err.message?.includes('401') || err.message?.includes('403')
            ? 'Authentication error. Please log in again.'
            : err.message || 'Failed to get a response. Check your connection.';
        setError(message);
      } finally {
        setIsStreaming(false);
        setStreamingContent('');
      }
    },
    [activeConversationId, systemPrompt, queryClient]
  );

  const handleRegenerate = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage) return;
    // Remove last assistant message
    setMessages((prev) => {
      const idx = [...prev].reverse().findIndex((m) => m.role === 'assistant');
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      return prev.slice(0, realIdx);
    });
    sendMessage(lastUserMessage.content, true);
  }, [messages, sendMessage]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversation sidebar */}
      <ConversationList
        conversations={conversations}
        activeId={activeConversationId}
        isCollapsed={sidebarCollapsed}
        onSelect={loadConversation}
        onNew={startNewConversation}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-border bg-zinc-950 flex-shrink-0">
          <div>
            <h1 className="text-sm font-semibold text-zinc-100">
              {activeConversationId
                ? conversations.find((c) => c.id === activeConversationId)?.title ?? 'Conversation'
                : 'New Conversation'}
            </h1>
            {isStreaming && (
              <p className="text-xs text-primary animate-pulse">AI is responding...</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>Connected</span>
          </div>
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          error={error}
          onRegenerate={handleRegenerate}
        />

        {/* Input */}
        <ChatInput
          isStreaming={isStreaming}
          onSubmit={sendMessage}
          onStop={stopGeneration}
          systemPrompt={systemPrompt}
          onSystemPromptChange={setSystemPrompt}
        />
      </div>
    </div>
  );
}
