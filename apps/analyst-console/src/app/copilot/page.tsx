'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ConversationSidebar } from '../../components/copilot/conversation-sidebar';
import { ChatWindow } from '../../components/copilot/chat-window';
import { CyberContextPanel } from '../../components/copilot/cyber-context-panel';
import { useAuth } from '../../contexts/auth-context';

export default function CopilotPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlId = searchParams?.get('id') || searchParams?.get('conversationId') || null;
  const alertId = searchParams?.get('alertId') || undefined;
  const [activeConversationId, setActiveConversationId] = useState<string | null>(urlId);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(true);

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
    <div className="flex h-full bg-slate-950 overflow-hidden border rounded-xl shadow-sm border-slate-800 relative">
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* 1. LEFT COLUMN: Conversation Sidebar (240-280px) */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-40 w-80 bg-slate-950 border-r border-slate-800/80 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-64 lg:w-72 flex-shrink-0 flex
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <ConversationSidebar 
          activeId={activeConversationId} 
          onSelect={handleSelectConversation}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* 2. CENTER COLUMN: Main SOC Copilot Analysis Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative h-full">
        <Suspense fallback={<div className="p-4 font-mono text-xs text-slate-400">Loading CyberAI SOC Copilot...</div>}>
          <ChatWindow 
            conversationId={activeConversationId} 
            onConversationCreated={handleConversationCreated}
            onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            onToggleContextPanel={() => setIsContextPanelOpen(!isContextPanelOpen)}
            isContextPanelOpen={isContextPanelOpen}
          />
        </Suspense>
      </div>

      {/* 3. RIGHT COLUMN: Investigation Cockpit Context Panel (300-360px) */}
      {isContextPanelOpen && (
        <div className="hidden xl:flex w-80 lg:w-80 shrink-0 h-full">
          <CyberContextPanel
            isOpen={isContextPanelOpen}
            onToggle={() => setIsContextPanelOpen(false)}
            activeCaseId={alertId || 'INC-2026-0192'}
          />
        </div>
      )}
    </div>
  );
}
