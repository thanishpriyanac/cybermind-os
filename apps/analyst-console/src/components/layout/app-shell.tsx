'use client';

import { ReactNode, useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { useAuth } from '../../contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-muted-foreground font-mono text-xs">Loading CYBERMIND OS...</div>;
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
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        mobileOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className={`flex-1 relative focus:outline-none ${isFullHeightPage ? 'overflow-hidden flex flex-col p-2 md:p-3' : 'overflow-y-auto py-4 px-3 sm:py-6 sm:px-6 md:px-8'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
