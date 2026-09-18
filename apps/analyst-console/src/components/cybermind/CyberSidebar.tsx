'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, 
  LayoutDashboard, 
  ShieldAlert, 
  BookOpen, 
  HeartPulse, 
  Bot, 
  ShieldCheck, 
  Shield, 
  Globe, 
  Server, 
  FileText, 
  X,
  Lock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface NavItem {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
}

export interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const CYBERMIND_NAVIGATION_GROUPS: NavGroup[] = [
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
      { name: 'CyberAI Copilot', href: '/copilot', icon: Bot },
      { name: 'VAPT Assessment', href: '/vapt', icon: Lock },
      { name: 'Firewall Health', href: '/firewall', icon: Server },
      { name: 'Playbooks', href: '/playbooks', icon: BookOpen },
    ],
  },
  {
    groupName: 'SECURITY TOOLKIT',
    items: [
      { name: 'IP Port Scanner', href: '/toolkit/ip-scanner', icon: Globe },
      { name: 'IOC Analyzer', href: '/toolkit/ioc-analyzer', icon: Activity },
      { name: 'URL Analyzer', href: '/toolkit/url-analyzer', icon: BookOpen },
      { name: 'Firewall Rule Analyzer', href: '/toolkit/firewall-rules', icon: Server },
      { name: 'Firewall Policy Simulator', href: '/toolkit/firewall-simulator', icon: Lock },
      { name: 'CVE Explainer', href: '/toolkit/cve-explainer', icon: Shield },
      { name: 'Log Analyzer', href: '/toolkit/log-analyzer', icon: FileText },
      { name: 'Log Converter', href: '/toolkit/log-converter', icon: Activity },
      { name: 'AD Security Checker', href: '/toolkit/ad-checker', icon: ShieldCheck },
      { name: 'DNS Analyzer', href: '/toolkit/dns-analyzer', icon: Globe },
      { name: 'DNS Troubleshooter', href: '/toolkit/dns-troubleshooter', icon: Activity },
      { name: 'Connectivity Tester', href: '/toolkit/connectivity-tester', icon: HeartPulse },
      { name: 'Traceroute Visualizer', href: '/toolkit/traceroute', icon: Activity },
      { name: 'PCAP Analyzer', href: '/toolkit/pcap-analyzer', icon: Server },
      { name: 'Security Cheat Sheets', href: '/toolkit/cheatsheets', icon: BookOpen },
      { name: 'Explain This Command', href: '/toolkit/command-explainer', icon: Bot },
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

export interface CyberSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function CyberSidebar({
  mobileOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: CyberSidebarProps) {
  const pathname = usePathname();
  const userRole = typeof window !== 'undefined' 
    ? (localStorage.getItem('user_role') || 'ADMIN').toUpperCase() 
    : 'ADMIN';
  const userEmail = typeof window !== 'undefined'
    ? (localStorage.getItem('email') || '').toLowerCase()
    : '';

  const isSaravanan = userEmail.includes('saravanan') || userRole === 'RESTRICTED_ANALYST';

  const renderNavItems = (isCollapsedMode = false) => (
    <nav className="flex-1 px-2.5 py-3 space-y-4">
      {CYBERMIND_NAVIGATION_GROUPS.map((group) => {
        const visibleItems = group.items.filter((item) => {
          if (item.adminOnly && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
            return false;
          }
          if (isSaravanan) {
            if (
              item.href.startsWith('/qbr') ||
              item.href.startsWith('/firewall') ||
              item.href.startsWith('/toolkit/firewall')
            ) {
              return false;
            }
          }
          return true;
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={group.groupName} className="space-y-1">
            {!isCollapsedMode && (
              <div className="px-3 text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase font-mono">
                {group.groupName}
              </div>
            )}
            {visibleItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  title={isCollapsedMode ? item.name : undefined}
                  className={cn(
                    'group relative flex items-center px-3 py-2 text-xs font-mono font-semibold rounded-lg transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary font-bold shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    isCollapsedMode ? 'justify-center px-2' : ''
                  )}
                >
                  {/* Refined Left Accent Indicator: ▌ Active State */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary" />
                  )}

                  <item.icon
                    className={cn(
                      'flex-shrink-0 h-4 w-4 transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                      !isCollapsedMode && 'mr-2.5'
                    )}
                    aria-hidden="true"
                  />
                  {!isCollapsedMode && <span className="truncate">{item.name}</span>}
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
      {/* Desktop Sidebar (220px-240px wide, 64px when collapsed) */}
      <div 
        className={cn(
          'hidden md:flex flex-col flex-shrink-0 bg-card/95 backdrop-blur-md border-r border-border/80 transition-all duration-200 z-20',
          collapsed ? 'w-16' : 'w-56 lg:w-60'
        )}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Brand Header */}
          <div className="flex items-center justify-between h-14 flex-shrink-0 px-3.5 border-b border-border/80">
            {!collapsed ? (
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-sm font-extrabold tracking-wider text-primary font-mono">
                  CYBERMIND OS
                </span>
              </Link>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
            )}

            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Toggle Sidebar Width"
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {renderNavItems(collapsed)}
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
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-card border-r border-border z-10 animate-in slide-in-from-left-5">
            <div className="flex items-center justify-between h-14 px-4 border-b border-border">
              <span className="text-sm font-extrabold tracking-wider text-primary font-mono flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
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
              {renderNavItems(false)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
