'use client';

import { format } from 'date-fns';
import { MessageSquare, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Conversation } from '../../lib/types';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  isCollapsed: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onToggle: () => void;
}

export function ConversationList({
  conversations,
  activeId,
  isCollapsed,
  onSelect,
  onNew,
  onToggle,
}: ConversationListProps) {
  return (
    <div
      className={cn(
        'flex flex-col h-full border-r border-border bg-zinc-950 transition-all duration-300 flex-shrink-0',
        isCollapsed ? 'w-14' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border h-14">
        {!isCollapsed && (
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Conversations
          </span>
        )}
        <div className="flex items-center gap-1 ml-auto">
          {!isCollapsed && (
            <button
              onClick={onNew}
              title="New Conversation"
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onToggle}
            title={isCollapsed ? 'Expand' : 'Collapse'}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* New chat button (collapsed) */}
      {isCollapsed && (
        <button
          onClick={onNew}
          title="New Conversation"
          className="flex items-center justify-center py-3 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 && !isCollapsed && (
          <p className="text-xs text-zinc-500 text-center mt-6 px-3">
            No conversations yet.
            <br />
            Start a new one!
          </p>
        )}
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            title={conv.title}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors group',
              activeId === conv.id
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            )}
          >
            <MessageSquare className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate font-medium">{conv.title}</p>
                <p className="text-xs text-zinc-500 truncate">
                  {format(new Date(conv.updatedAt), 'MMM d, HH:mm')}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
