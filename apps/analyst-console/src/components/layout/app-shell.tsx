'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { useAuth } from '../../contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';

// Pages that manage their own scroll / full-height layout
const FULL_HEIGHT_PAGES = ['/chat'];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-zinc-400">
          <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading CYBERMIND OS...</span>
        </div>
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

  const isFullHeight = FULL_HEIGHT_PAGES.some((p) => pathname.startsWith(p));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full min-w-0 overflow-hidden">
        <Topbar />
        {isFullHeight ? (
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        ) : (
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6 px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
