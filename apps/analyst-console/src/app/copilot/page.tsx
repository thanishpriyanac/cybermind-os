'use client';

import { useState, useEffect, Suspense } from 'react';
import { ConversationSidebar } from '../../components/copilot/conversation-sidebar';
import { ChatWindow } from '../../components/copilot/chat-window';
import { useAuth } from '../../contexts/auth-context';

export default function CopilotPage() {
  const { user } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (!user) return null;

  return (
    <div className="flex h-full bg-background overflow-hidden border rounded-xl shadow-sm border-border">
      {/* Sidebar - Collapsible on small screens */}
      <div 
        className={`
          ${isSidebarOpen ? 'w-64 flex' : 'hidden'} 
          md:flex md:w-72 lg:w-80 flex-shrink-0 border-r border-border bg-card
          transition-all duration-300 ease-in-out
        `}
      >
        <ConversationSidebar 
          activeId={activeConversationId} 
          onSelect={setActiveConversationId} 
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        {/* Mobile toggle button */}
        <button 
          className="md:hidden absolute top-4 left-4 z-10 p-2 rounded-md bg-card border border-border shadow-sm text-foreground"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? 'Close' : 'Menu'}
        </button>

        <Suspense fallback={<div>Loading copilot...</div>}>
          <ChatWindow 
            conversationId={activeConversationId} 
            onConversationCreated={setActiveConversationId}
          />
        </Suspense>
      </div>
    </div>
  );
}
