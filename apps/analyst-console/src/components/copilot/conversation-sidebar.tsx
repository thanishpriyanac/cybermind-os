'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Search, MoreVertical, Trash2, Edit2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  title: string;
  lastMessageAt: string;
  model: string;
}

interface SidebarProps {
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

export function ConversationSidebar({ activeId, onSelect }: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      // Fetch user's active conversations from AI Gateway
      const res = await fetch('/api/v1/ai/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch conversations', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/v1/ai/conversations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Soft deleted on backend, remove from local UI list
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeId === id) {
          onSelect(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex flex-col gap-4">
        <button 
          onClick={() => onSelect(null)}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-muted border border-border text-foreground text-sm rounded-md pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No conversations found.
          </div>
        ) : (
          filteredConversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full flex flex-col items-start gap-1 p-3 rounded-lg text-left transition-colors group relative ${
                activeId === conv.id ? 'bg-secondary text-secondary-foreground' : 'hover:bg-muted text-foreground'
              }`}
            >
              <div className="flex items-center w-full gap-2">
                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeId === conv.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-medium text-sm truncate flex-1">
                  {conv.title || 'New Conversation'}
                </span>
                
                {/* Actions overlay */}
                <div className="hidden group-hover:flex items-center gap-1 absolute right-2 bg-gradient-to-l from-muted via-muted to-transparent pl-4">
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer" />
                  <Trash2 
                    className="w-3.5 h-3.5 text-red-500 hover:text-red-400 cursor-pointer" 
                    onClick={(e) => handleDelete(e, conv.id)}
                    title="Delete Conversation"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between w-full text-xs text-muted-foreground pl-6">
                <span className="truncate max-w-[100px]">{conv.model}</span>
                <span>{conv.lastMessageAt ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true }) : ''}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
