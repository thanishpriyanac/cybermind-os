'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ConversationSidebar } from '../../components/copilot/conversation-sidebar';
import { ChatWindow } from '../../components/copilot/chat-window';
import { useAuth } from '../../contexts/auth-context';

export default function CopilotPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlId = searchParams?.get('id') || searchParams?.get('conversationId') || null;
  const [activeConversationId, setActiveConversationId] = useState<string | null>(urlId);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (urlId && urlId !== activeConversationId) {
      setActiveConversationId(urlId);
    }
  }, [urlId]);

  if (!user) return null;

  const handleSelectConversation = (id: string | null) => {
    setActiveConversationId(id);
    setIsMobileSidebarOpen(false);
    if (id) {
      router.replace(`/copilot?id=${id}`, { scroll: false });
    } else {
      router.replace('/copilot', { scroll: false });
    }
  };

  const handleConversationCreated = (id: string) => {
    setActiveConversationId(id);
    router.replace(`/copilot?id=${id}`, { scroll: false });
  };

  return (
    <div className="flex h-full bg-background overflow-hidden border rounded-xl shadow-sm border-border relative">
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Drawer on Mobile, Static Panel on Desktop */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-40 w-80 bg-card border-r border-border transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-72 lg:w-80 flex-shrink-0 flex
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <ConversationSidebar 
          activeId={activeConversationId} 
          onSelect={handleSelectConversation}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative h-full">
        <Suspense fallback={<div className="p-4 text-muted-foreground">Loading copilot...</div>}>
          <ChatWindow 
            conversationId={activeConversationId} 
            onConversationCreated={handleConversationCreated}
            onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          />
        </Suspense>
      </div>
    </div>
  );
}
