'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LayoutDashboard, ShieldAlert, BookOpen, HeartPulse, Bot, ShieldCheck, Shield, Globe, Server, FileText, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface NavGroup {
  groupName: string;
  items: {
    name: string;
    href: string;
    icon: any;
    adminOnly?: boolean;
  }[];
}

export const navigationGroups: NavGroup[] = [
  {
    groupName: 'OPERATIONS',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Alerts', href: '/alerts', icon: ShieldAlert },
      { name: 'Investigations', href: '/investigations', icon: Activity },
    ],
  },
  {
    groupName: 'THREAT INTELLIGENCE',
    items: [
      { name: 'CVE Intelligence', href: '/cve', icon: Shield },
      { name: 'IP Intelligence', href: '/ip', icon: Globe },
    ],
  },
  {
    groupName: 'SECURITY ANALYSIS',
    items: [
      { name: 'CyberAI', href: '/copilot', icon: Bot },
      { name: 'VAPT Assessment', href: '/vapt', icon: ShieldAlert },
      { name: 'Firewall Health', href: '/firewall', icon: Server },
      { name: 'Playbooks', href: '/playbooks', icon: BookOpen },
    ],
  },
  {
    groupName: 'REPORTING',
    items: [
      { name: 'QBR Reports', href: '/qbr', icon: FileText },
    ],
  },
  {
    groupName: 'PLATFORM',
    items: [
      { name: 'System Health', href: '/health', icon: HeartPulse },
      { name: 'Admin Center', href: '/admin', icon: ShieldCheck, adminOnly: true },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const userRole = typeof window !== 'undefined' 
    ? (localStorage.getItem('user_role') || 'ADMIN').toUpperCase() 
    : 'ADMIN';
  const userEmail = typeof window !== 'undefined'
    ? (localStorage.getItem('email') || '').toLowerCase()
    : '';
  const restrictedPaths: string[] = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('restricted_paths') || '[]')
    : [];

  const isSaravanan = userEmail.includes('saravanan') || userRole === 'RESTRICTED_ANALYST';

  const renderNavItems = () => (
    <nav className="flex-1 px-3 py-3 space-y-4">
      {navigationGroups.map((group) => {
        const visibleItems = group.items.filter((item) => {
          if (item.adminOnly && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
            return false;
          }
          if (isSaravanan) {
            if (item.href.startsWith('/qbr') || item.href.startsWith('/firewall')) {
              return false;
            }
          }
          if (restrictedPaths.some((p) => item.href.startsWith(p))) {
            return false;
          }
          return true;
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={group.groupName} className="space-y-1">
            <div className="px-3 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase font-mono">
              {group.groupName}
            </div>
            {visibleItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    isActive
                      ? 'bg-primary/15 text-primary font-bold border-l-2 border-primary'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    'group flex items-center px-3 py-2 text-xs font-medium rounded-md transition-all'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                      'mr-2.5 flex-shrink-0 h-4 w-4'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col flex-shrink-0 bg-card/90 backdrop-blur-md border-r border-border">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-border">
            <span className="text-lg font-extrabold tracking-wider text-primary flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              CYBERMIND OS
            </span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            {renderNavItems()}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={onClose} 
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-card border-r border-border z-10">
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
              <span className="text-base font-bold tracking-wider text-primary flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                CYBERMIND OS
              </span>
              <button 
                onClick={onClose}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderNavItems()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

