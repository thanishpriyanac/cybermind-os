'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Check, Copy } from 'lucide-react';
import { useState, useCallback } from 'react';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  const lang = className?.replace('language-', '') ?? '';

  return (
    <div className="group relative my-4 rounded-lg overflow-hidden border border-border bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-border">
        <span className="text-xs text-zinc-400 font-mono">{lang || 'code'}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <><Check className="h-3.5 w-3.5 text-green-400" /><span className="text-green-400">Copied</span></>
          ) : (
            <><Copy className="h-3.5 w-3.5" /><span>Copy</span></>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert prose-sm max-w-none
      prose-p:leading-relaxed prose-p:my-2
      prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
      prose-ul:my-2 prose-ol:my-2
      prose-li:my-0.5
      prose-blockquote:border-l-primary prose-blockquote:text-zinc-400
      prose-table:text-sm prose-th:text-left prose-th:font-semibold
      prose-strong:text-zinc-100 prose-em:text-zinc-300
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ node, className, children, ...props }) {
            const inline = !className;
            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-200"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock className={className}>
                {String(children).replace(/\n$/, '')}
              </CodeBlock>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border border-border rounded-lg overflow-hidden">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="px-4 py-2 bg-zinc-800 border-b border-border text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-2 border-b border-border text-sm text-zinc-300">
                {children}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-0.5 bg-primary rounded-sm animate-pulse align-middle" />
      )}
    </div>
  );
}
