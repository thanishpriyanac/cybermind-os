'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  StopCircle,
  RefreshCcw,
  Info,
  Check,
  Copy,
  Paperclip,
  FileCode,
  Network,
  FileText,
  UploadCloud,
  X,
  File as FileIcon,
  PanelLeft,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/auth-context';

export interface AttachedFile {
  name: string;
  size: number;
  type: string;
  preview?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: any;
  tokenUsage?: number;
  latencyMs?: number;
  attachments?: AttachedFile[];
}

interface ChatWindowProps {
  conversationId: string | null;
  onConversationCreated: (id: string) => void;
  onToggleSidebar?: () => void;
}

const MODELS = [
  { id: 'auto', name: 'Auto (Smart Router)' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'deepseek-ai/deepseek-v4-flash', name: 'DeepSeek V4 Flash' },
  { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek V4 Pro' },
  { id: 'grok-2-1212', name: 'Grok' },
  { id: 'llama3.1', name: 'Local Llama 3.1' },
  { id: 'qwen2.5-coder', name: 'Local Qwen' },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileCategory(filename: string): 'pcap' | 'config' | 'log' | 'doc' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['pcap', 'pcapng', 'cap'].includes(ext)) return 'pcap';
  if (['yaml', 'yml', 'json', 'conf', 'rules', 'sigma'].includes(ext)) return 'config';
  if (['log', 'txt', 'csv', 'evtx'].includes(ext)) return 'log';
  return 'doc';
}

function renderFileIcon(category: 'pcap' | 'config' | 'log' | 'doc', className: string) {
  switch (category) {
    case 'pcap':
      return <Network className={className} />;
    case 'config':
      return <FileCode className={className} />;
    case 'log':
      return <FileText className={className} />;
    default:
      return <FileIcon className={className} />;
  }
}

export function ChatWindow({ conversationId, onConversationCreated, onToggleSidebar }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [expandedMetadata, setExpandedMetadata] = useState<Record<string, boolean>>({});
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const searchParams = useSearchParams();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUserScrolledUpRef = useRef(false);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const alertId = searchParams?.get('alertId');
    if (alertId && !conversationId && messages.length === 0) {
      setInput(`Please help me analyze alert: ${alertId}`);
    }
  }, [searchParams, conversationId, messages.length]);

  useEffect(() => {
    if (conversationId) {
      if (!isGenerating) {
        fetchMessages();
      }
    } else if (!isGenerating) {
      setMessages([]);
    }
  }, [conversationId]);

  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantId) headers['x-tenant-id'] = tenantId;
      if (user?.email) headers['x-user-id'] = user.email;

      const res = await fetch(`/api/v1/ai/conversations/${conversationId}/messages`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
        scrollToBottom(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Stop forcing auto-scroll if user manually scrolled up > 100px from bottom
    isUserScrolledUpRef.current = scrollHeight - (scrollTop + clientHeight) > 100;
  };

  const scrollToBottom = (force = false) => {
    if (!force && isUserScrolledUpRef.current) return;
    if (animFrameIdRef.current) return;

    animFrameIdRef.current = requestAnimationFrame(() => {
      animFrameIdRef.current = null;
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    });
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleFilesAdded = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles: AttachedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      let preview = '';

      // If text or config file, read preview snippet
      const category = getFileCategory(f.name);
      if (f.size < 500_000 && category !== 'pcap') {
        try {
          preview = (await f.text()).slice(0, 2000);
        } catch {
          // ignore
        }
      }

      newFiles.push({
        name: f.name,
        size: f.size,
        type: f.type || category,
        preview,
      });
    }

    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      await handleFilesAdded(e.dataTransfer.files);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isGenerating) return;

    const currentAttachments = [...attachedFiles];
    const userMessageContent =
      input.trim() ||
      (currentAttachments.length > 0
        ? `Please analyze the uploaded file: ${currentAttachments.map((f) => f.name).join(', ')}`
        : '');

    setInput('');
    setAttachedFiles([]);
    setIsGenerating(true);

    const tempUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent,
      createdAt: new Date().toISOString(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    scrollToBottom();

    const tempAssistantMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: tempAssistantMsgId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      },
    ]);

    abortControllerRef.current = new AbortController();

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantId) headers['x-tenant-id'] = tenantId;
      if (user?.email) headers['x-user-id'] = user.email;

      const res = await fetch('/api/v1/ai/chat/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversationId,
          message: userMessageContent,
          modelKey: selectedModel,
          attachments: currentAttachments,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);

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
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === tempAssistantMsgId ? { ...m, content: aiContent } : m
                    )
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
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantMsgId && !m.content
              ? {
                  ...m,
                  content:
                    '⚠️ Unable to connect to the AI service. Please verify your connection or try again.',
                }
              : m
          )
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
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
    setExpandedMetadata((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      className="flex flex-col h-full bg-background relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-30 bg-primary/15 backdrop-blur-sm border-2 border-dashed border-primary flex flex-col items-center justify-center gap-3">
          <UploadCloud className="w-12 h-12 text-primary animate-bounce" />
          <p className="text-base font-medium text-foreground">
            Drop PCAP, config, rule, or log files here
          </p>
          <p className="text-xs text-muted-foreground">
            Supported: .pcap, .pcapng, .yaml, .json, .conf, .log, .rules
          </p>
        </div>
      )}

      {/* Topbar inside Chat Window */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border"
              title="Toggle Sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-semibold tracking-tight">CYBERMIND AI</h2>
            <p className="text-xs text-muted-foreground">AI-assisted analysis & response</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-sm bg-muted border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Message List */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-medium">How can I help you today?</h3>
            <p className="text-sm text-muted-foreground">
              I can analyze logs, explain PCAPs, generate incident summaries, or audit security configs.
            </p>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <button
                onClick={() => setInput('Explain the latest Ransomware Canary alert on host DB-01')}
                className="text-xs bg-muted hover:bg-muted/80 text-foreground border border-border px-3 py-1.5 rounded-full transition-colors"
              >
                🚨 Triage Canary Alert
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
              >
                <Paperclip className="w-3 h-3" /> Upload PCAP / Config
              </button>
              <button
                onClick={() => setInput('Check threat score and risk assessment for IP 198.51.100.23')}
                className="text-xs bg-muted hover:bg-muted/80 text-foreground border border-border px-3 py-1.5 rounded-full transition-colors"
              >
                🌐 IP Threat Intelligence
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            if (msg.role === 'system') return null;
            const isUser = msg.role === 'user';

            return (
              <div key={msg.id} className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center mt-1 ${
                    isUser
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-5 py-3 ${
                      isUser
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm border border-border'
                    }`}
                  >
                    {/* Render Attachments if present on user message */}
                    {isUser && msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5 pb-2 border-b border-primary-foreground/20">
                        {msg.attachments.map((file, fIdx) => {
                          const cat = getFileCategory(file.name);
                          return (
                            <div
                              key={fIdx}
                              className="flex items-center gap-1.5 bg-black/20 dark:bg-white/10 px-2 py-1 rounded text-xs"
                            >
                              {renderFileIcon(cat, 'w-3.5 h-3.5 opacity-90')}
                              <span className="font-medium truncate max-w-[160px]">{file.name}</span>
                              <span className="text-[10px] opacity-75">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

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
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Metadata & Actions */}
                  {!isUser && msg.content && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground ml-1">
                      {msg.metadata?.model && (
                        <button
                          onClick={() => toggleMetadata(msg.id)}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
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
        <div className="relative max-w-4xl mx-auto flex flex-col bg-muted rounded-xl border border-border p-2 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-sm">
          {/* File Attachment Previews */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2 pb-2 mb-1 border-b border-border/60">
              {attachedFiles.map((file, idx) => {
                const cat = getFileCategory(file.name);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 bg-background border border-border px-2.5 py-1 rounded-lg text-xs shadow-sm animate-in fade-in duration-200"
                  >
                    {renderFileIcon(
                      cat,
                      cat === 'pcap'
                        ? 'w-3.5 h-3.5 text-blue-500'
                        : cat === 'config'
                        ? 'w-3.5 h-3.5 text-amber-500'
                        : 'w-3.5 h-3.5 text-green-500'
                    )}
                    <span className="font-medium truncate max-w-[150px]">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      ({formatFileSize(file.size)})
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachedFile(idx)}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted"
                      title="Remove file"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Textarea & Controls */}
          <div className="flex items-end gap-2 w-full">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => handleFilesAdded(e.target.files)}
              className="hidden"
              accept=".pcap,.pcapng,.cap,.json,.yaml,.yml,.conf,.log,.txt,.csv,.xml,.rules,.sigma"
              multiple
            />

            {/* Paperclip Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mb-0.5"
              title="Attach PCAP, Config, Rule, or Log file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Input Textarea */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                attachedFiles.length > 0
                  ? 'Add instructions or press Send to analyze attached files...'
                  : 'Ask CyberAI anything, or attach PCAP / config files...'
              }
              className="w-full max-h-48 min-h-[40px] bg-transparent border-0 resize-none focus:ring-0 text-sm py-2 px-1 text-foreground placeholder:text-muted-foreground"
              rows={1}
              style={{
                height: 'auto',
                minHeight: '40px',
              }}
            />

            {/* Send / Stop Action Button */}
            <div className="flex flex-col justify-end pb-0.5 pr-0.5 flex-shrink-0">
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
                  disabled={!input.trim() && attachedFiles.length === 0}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between max-w-4xl mx-auto px-1 mt-2 text-[10px] text-muted-foreground">
          <span>Supported: PCAP, PCAPNG, YAML, JSON, CONF, SIGMA, LOGS</span>
          <span>CyberAI can make mistakes. Verify critical security decisions.</span>
        </div>
      </div>
    </div>
  );
}
