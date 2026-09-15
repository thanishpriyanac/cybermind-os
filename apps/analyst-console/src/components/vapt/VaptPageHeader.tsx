'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export interface VaptPageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export function VaptPageHeader({
  title,
  subtitle,
  backHref,
  badge,
  actions,
}: VaptPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border/60 pb-4">
      <div className="flex items-start sm:items-center gap-3">
        {backHref && (
          <Link href={backHref}>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {!backHref && <ShieldAlert className="h-6 w-6 text-primary shrink-0 animate-pulse" />}
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground leading-relaxed font-mono">{subtitle}</p>}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
