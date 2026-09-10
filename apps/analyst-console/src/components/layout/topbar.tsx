'use client';

import Link from 'next/link';
import { useAuth } from '../../contexts/auth-context';
import { LogOut, User as UserIcon, ShieldCheck, Menu, Shield } from 'lucide-react';
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

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="flex-1 px-3 sm:px-4 flex justify-between items-center">
        {/* Left Side: Mobile Menu Button & Brand Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden text-foreground hover:bg-muted"
            aria-label="Open Mobile Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <span className="md:hidden font-extrabold text-sm sm:text-base tracking-wider text-primary flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-cyan-400" />
            CYBERMIND
          </span>
        </div>

        {/* Right Side: Tenant Badge & Account Menu */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {user?.tenantId && (
            <Badge variant="secondary" className="hidden sm:inline-flex px-3 py-1 text-xs font-mono">
              Tenant: {user.tenantId}
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full border border-border">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none truncate">{user?.email}</p>
                  <p className="text-[10px] text-cyan-400 font-mono">Role: {(user?.role || 'ADMIN').toUpperCase()}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center w-full cursor-pointer text-xs">
                  <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                  <span>Platform Admin Center</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-xs text-rose-400">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
