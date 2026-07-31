'use client';

import { useRef, useState, useCallback, KeyboardEvent } from 'react';
import { Send, Square, Paperclip, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ChatInputProps {
  isStreaming: boolean;
  onSubmit: (message: string) => void;
  onStop: () => void;
  systemPrompt: string;
  onSystemPromptChange: (v: string) => void;
}

const SYSTEM_PROMPTS = [
  { id: 'security', label: 'Security Analyst' },
  { id: 'firewall', label: 'Firewall Analyzer' },
  { id: 'cve', label: 'CVE Researcher' },
  { id: 'incident', label: 'Incident Responder' },
  { id: 'sigma', label: 'Sigma Generator' },
];

export function ChatInput({
  isStreaming,
  onSubmit,
  onStop,
  systemPrompt,
  onSystemPromptChange,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [showPrompts, setShowPrompts] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSubmit(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isStreaming, onSubmit]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const selectedPrompt = SYSTEM_PROMPTS.find((p) => p.id === systemPrompt);

  return (
    <div className="border-t border-border bg-zinc-950 px-4 py-4">
      <div className="max-w-4xl mx-auto">
        {/* System prompt selector */}
        <div className="flex items-center gap-2 mb-2">
          <div className="relative">
            <button
              onClick={() => setShowPrompts(!showPrompts)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
            >
              <span>Mode: {selectedPrompt?.label ?? 'Security Analyst'}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {showPrompts && (
              <div className="absolute bottom-full mb-1 left-0 z-50 w-48 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl py-1">
                {SYSTEM_PROMPTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSystemPromptChange(p.id);
                      setShowPrompts(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-xs transition-colors',
                      systemPrompt === p.id
                        ? 'text-primary bg-primary/10'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs text-zinc-600">Shift+Enter for new line · Enter to send</span>
        </div>

        {/* Input area */}
        <div className="flex items-end gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 focus-within:border-zinc-600 transition-colors">
          <button
            title="Attach file (coming soon)"
            disabled
            className="flex-shrink-0 mb-0.5 p-1 rounded-lg text-zinc-600 cursor-not-allowed"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask CYBERMIND anything... (analyze logs, CVE lookup, generate Sigma rules)"
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none leading-relaxed min-h-[24px] max-h-[200px]"
          />

          {isStreaming ? (
            <button
              onClick={onStop}
              title="Stop generation"
              className="flex-shrink-0 mb-0.5 w-8 h-8 rounded-lg bg-red-900/50 border border-red-700/50 flex items-center justify-center text-red-400 hover:bg-red-900 transition-colors"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!value.trim()}
              title="Send message"
              className="flex-shrink-0 mb-0.5 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <p className="text-center text-xs text-zinc-700 mt-2">
          CYBERMIND AI may make mistakes. Always verify security findings.
        </p>
      </div>
    </div>
  );
}
