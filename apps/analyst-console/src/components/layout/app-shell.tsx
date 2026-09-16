'use client';

import { ReactNode, useState } from 'react';
import { CyberSidebar } from '../cybermind/CyberSidebar';
import { CyberTopbar } from '../cybermind/CyberTopbar';
import { CyberCommandPalette } from '../cybermind/CyberCommandPalette';
import { useAuth } from '../../contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background text-primary font-mono text-xs space-y-2">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span>CYBERMIND OS — Initializing SOC Engine...</span>
      </div>
    );
  }

  if (!user && pathname !== '/login') {
    router.push('/login');
    return null;
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  const isFullHeightPage = pathname === '/copilot';

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Redesigned CyberMind Sidebar */}
      <CyberSidebar 
        mobileOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Workspace Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Redesigned CyberMind Topbar */}
        <CyberTopbar 
          onMenuClick={() => setMobileMenuOpen(true)} 
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        {/* Workspace Main Section */}
        <main className={`flex-1 relative focus:outline-none ${
          isFullHeightPage 
            ? 'overflow-hidden flex flex-col p-2 sm:p-3' 
            : 'overflow-y-auto py-4 px-3 sm:py-6 sm:px-6 md:px-8'
        }`}>
          {children}
        </main>
      </div>

      {/* Cmd+K Global Command Palette */}
      <CyberCommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />
    </div>
  );
}
