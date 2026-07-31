'use client';

import { useRef, useEffect } from 'react';
import { Bot, User, Copy, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Message } from '../../lib/types';
import { MarkdownRenderer } from './markdown-renderer';
import { useState, useCallback } from 'react';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  isStreaming: boolean;
  onRegenerate?: () => void;
}

function MessageBubble({ message, isLast, isStreaming, onRegenerate }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  return (
    <div className={cn('group flex gap-3 px-4 py-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5',
          isUser
            ? 'bg-primary/20 border border-primary/30'
            : 'bg-zinc-800 border border-zinc-700'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary" />
        ) : (
          <Bot className="h-4 w-4 text-zinc-300" />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-w-0 max-w-[85%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'bg-primary/10 border border-primary/20 text-zinc-100 rounded-tr-sm'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-sm'
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer
              content={message.content}
              isStreaming={isLast && isStreaming}
            />
          )}
        </div>

        {/* Metadata & actions */}
        <div
          className={cn(
            'flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity',
            isUser ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <span className="text-xs text-zinc-500">
            {format(new Date(message.createdAt), 'HH:mm')}
            {message.model && (
              <span className="ml-2 text-zinc-600">· {message.model}</span>
            )}
            {message.totalTokens && (
              <span className="ml-2 text-zinc-600">· {message.totalTokens} tokens</span>
            )}
          </span>

          <button
            onClick={copy}
            title="Copy message"
            className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
          </button>

          {!isUser && isLast && !isStreaming && onRegenerate && (
            <button
              onClick={onRegenerate}
              title="Regenerate response"
              className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  onRegenerate: () => void;
}

export function MessageList({
  messages,
  isStreaming,
  streamingContent,
  error,
  onRegenerate,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto scroll to bottom when streaming
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, autoScroll]);

  // Detect manual scroll up = disable auto scroll
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setAutoScroll(atBottom);
  };

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-100 mb-2">CYBERMIND AI</h2>
        <p className="text-sm text-zinc-500 max-w-md">
          Your AI Security Copilot. Ask about threats, analyze logs, upload documents, generate Sigma rules, or investigate incidents.
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
          {[
            'Analyze this firewall config for vulnerabilities',
            'Generate a Sigma rule for lateral movement detection',
            'What are the top CVEs affecting Apache 2.4?',
            'Summarize the MITRE ATT&CK technique T1059',
          ].map((suggestion) => (
            <button
              key={suggestion}
              className="text-left text-xs px-3 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto scroll-smooth"
    >
      <div className="max-w-4xl mx-auto py-4">
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isLast={i === messages.length - 1}
            isStreaming={isStreaming && i === messages.length - 1}
            onRegenerate={onRegenerate}
          />
        ))}

        {/* Streaming assistant message */}
        {isStreaming && streamingContent && (
          <div className="flex gap-3 px-4 py-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 bg-zinc-800 border border-zinc-700">
              <Bot className="h-4 w-4 text-zinc-300" />
            </div>
            <div className="flex-1 min-w-0 max-w-[85%]">
              <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-zinc-900 border border-zinc-800">
                <MarkdownRenderer content={streamingContent} isStreaming={true} />
              </div>
            </div>
          </div>
        )}

        {/* Streaming indicator (no content yet) */}
        {isStreaming && !streamingContent && (
          <div className="flex gap-3 px-4 py-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 bg-zinc-800 border border-zinc-700">
              <Bot className="h-4 w-4 text-zinc-300" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-zinc-900 border border-zinc-800">
              <div className="flex gap-1 items-center h-5">
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-4 my-2 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-950/50 border border-red-900/50 text-red-400 text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
