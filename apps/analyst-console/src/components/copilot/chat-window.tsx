'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, StopCircle, RefreshCcw, Info, Check, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/auth-context';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: any;
  tokenUsage?: number;
  latencyMs?: number;
}

interface ChatWindowProps {
  conversationId: string | null;
  onConversationCreated: (id: string) => void;
}

const MODELS = [
  { id: 'auto', name: 'Auto (Smart Router)' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'deepseek-ai/deepseek-v4-flash', name: 'DeepSeek V4 Flash' },
  { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek V4 Pro' },
  { id: 'grok-2-1212', name: 'Grok' },
  { id: 'llama3.1', name: 'Local Llama 3.1' },
  { id: 'qwen2.5-coder', name: 'Local Qwen' }
];

export function ChatWindow({ conversationId, onConversationCreated }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [expandedMetadata, setExpandedMetadata] = useState<Record<string, boolean>>({});
  const searchParams = useSearchParams();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const alertId = searchParams?.get('alertId');
    if (alertId && !conversationId && messages.length === 0) {
      setInput(`Please help me analyze alert: ${alertId}`);
    }
  }, [searchParams, conversationId, messages.length]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      const res = await fetch(`/api/v1/ai/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
        scrollToBottom();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessageContent = input;
    setInput('');
    setIsGenerating(true);

    const tempUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempUserMsg]);
    scrollToBottom();

    const tempAssistantMsgId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      {
        id: tempAssistantMsgId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString()
      }
    ]);

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/v1/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: userMessageContent,
          modelKey: selectedModel,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error('Failed to start stream');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No reader available');

      let done = false;
      let aiContent = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'conversation_id' && !conversationId) {
                  onConversationCreated(data.conversationId);
                } else if (data.delta) {
                  aiContent += data.delta;
                  setMessages(prev => 
                    prev.map(m => m.id === tempAssistantMsgId ? { ...m, content: aiContent } : m)
                  );
                  scrollToBottom();
                }
              } catch (e) {
                // Ignore parse errors on incomplete chunks
              }
            }
          }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('Streaming error', e);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
      // Refresh to get actual metadata persisted in DB
      if (conversationId) {
        fetchMessages();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleMetadata = (id: string) => {
    setExpandedMetadata(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Topbar inside Chat Window */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 md:pl-4 pl-16">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">CYBERMIND Copilot</h2>
          <p className="text-xs text-muted-foreground">AI-assisted analysis & response</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-sm bg-muted border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-medium">How can I help you today?</h3>
            <p className="text-sm text-muted-foreground">
              I can analyze logs, explain PCAPs, generate incident summaries, or answer questions about threats.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            if (msg.role === 'system') return null;
            const isUser = msg.role === 'user';

            return (
              <div key={msg.id} className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center mt-1 ${isUser ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-2xl px-5 py-3 ${isUser ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm border border-border'}`}>
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {msg.content === '' && isGenerating && index === messages.length - 1 ? (
                          <div className="flex gap-1 items-center h-5">
                            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
                          </div>
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Metadata & Actions */}
                  {!isUser && msg.content && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground ml-1">
                      {msg.metadata?.model && (
                        <button onClick={() => toggleMetadata(msg.id)} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          <Info className="w-3 h-3" />
                          <span>{msg.metadata.model}</span>
                        </button>
                      )}
                      
                      {expandedMetadata[msg.id] && msg.metadata && (
                        <div className="flex items-center gap-3 border-l pl-3 border-border">
                          {msg.latencyMs !== undefined && <span>{msg.latencyMs}ms</span>}
                          {msg.tokenUsage !== undefined && <span>{msg.tokenUsage} tokens</span>}
                          <span>Provider: {msg.metadata.provider || 'auto'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card">
        <div className="relative max-w-4xl mx-auto flex items-end gap-2 bg-muted rounded-xl border border-border p-2 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Copilot anything..."
            className="w-full max-h-48 min-h-[44px] bg-transparent border-0 resize-none focus:ring-0 text-sm p-3 text-foreground"
            rows={1}
            style={{
              height: 'auto',
              minHeight: '44px'
            }}
          />
          
          <div className="flex flex-col justify-end pb-1 pr-1 flex-shrink-0">
            {isGenerating ? (
              <button 
                onClick={stopGeneration}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                title="Stop generation"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={sendMessage}
                disabled={!input.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="text-center mt-2 text-[10px] text-muted-foreground">
          Copilot can make mistakes. Verify critical security decisions.
        </div>
      </div>
    </div>
  );
}
