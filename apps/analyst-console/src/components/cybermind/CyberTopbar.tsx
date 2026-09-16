'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/auth-context';
import { LogOut, User as UserIcon, ShieldCheck, Menu, Shield, Search, Command, Bell, Activity } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export interface CyberTopbarProps {
  onMenuClick?: () => void;
  onOpenCommandPalette?: () => void;
}

export function CyberTopbar({ onMenuClick, onOpenCommandPalette }: CyberTopbarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const getBreadcrumbLabel = () => {
    if (pathname.startsWith('/dashboard')) return 'SOC Command Center';
    if (pathname.startsWith('/alerts')) return 'Alerts Triage Workspace';
    if (pathname.startsWith('/investigations')) return 'Security Investigations';
    if (pathname.startsWith('/copilot')) return 'CyberAI Copilot Workspace';
    if (pathname.startsWith('/cve')) return 'CVE Vulnerability Intelligence';
    if (pathname.startsWith('/ip')) return 'IP Threat Intelligence';
    if (pathname.startsWith('/vapt')) return 'VAPT Security Assessment Engine';
    if (pathname.startsWith('/firewall')) return 'Firewall Health Check';
    if (pathname.startsWith('/playbooks')) return 'Response Playbooks';
    if (pathname.startsWith('/qbr')) return 'QBR Executive Reports';
    if (pathname.startsWith('/health')) return 'System Health & Telemetry';
    if (pathname.startsWith('/admin')) return 'Platform Admin Center';
    return 'Analyst Console';
  };

  return (
    <header className="sticky top-0 z-30 flex-shrink-0 flex h-14 bg-card/95 backdrop-blur-md border-b border-border/80 shadow-sm">
      <div className="flex-1 px-3 sm:px-4 flex justify-between items-center">
        {/* Left: Mobile Menu Button & Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden h-9 w-9 text-foreground hover:bg-muted shrink-0"
            aria-label="Open Mobile Navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2 text-xs font-mono truncate">
            <span className="text-muted-foreground font-semibold hidden sm:inline">CyberMind OS</span>
            <span className="text-muted-foreground/60 hidden sm:inline">/</span>
            <span className="text-foreground font-bold truncate text-xs sm:text-xs">
              {getBreadcrumbLabel()}
            </span>
          </div>
        </div>

        {/* Center: Global Command Palette Trigger ("Search CyberMind... ⌘K") */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <button
            onClick={onOpenCommandPalette}
            className="w-full h-9 px-3 rounded-lg bg-muted/40 border border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/50 text-xs font-mono flex items-center justify-between transition-colors shadow-inner"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">Search CyberMind OS (CVE, IP, Alerts, VAPT...)...</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] bg-background border border-border/80 text-muted-foreground px-1.5 py-0.5 rounded font-mono">
              <Command className="w-3 h-3 text-cyan-400" />
              <span>K</span>
            </kbd>
          </button>
        </div>

        {/* Right: Health Badge, Tenant Badge & User Menu */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenCommandPalette}
            className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* System Status Badge */}
          <Badge className="hidden lg:inline-flex bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>SOC ONLINE</span>
          </Badge>

          {/* Tenant Indicator */}
          {user?.tenantId && (
            <Badge variant="secondary" className="hidden sm:inline-flex px-2.5 py-1 text-[11px] font-mono border border-border/80">
              Tenant: {user.tenantId}
            </Badge>
          )}

          {/* Account Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full border border-border/80 hover:border-primary/50">
                <UserIcon className="h-4 w-4 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 font-mono text-xs" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-bold leading-none truncate text-foreground">{user?.email}</p>
                  <p className="text-[10px] text-cyan-400">Role: {((user as any)?.role || 'ADMIN').toUpperCase()}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center w-full cursor-pointer">
                  <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                  <span>Platform Admin Center</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/health" className="flex items-center w-full cursor-pointer">
                  <Activity className="mr-2 h-4 w-4 text-cyan-400" />
                  <span>System Telemetry</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-rose-400 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
