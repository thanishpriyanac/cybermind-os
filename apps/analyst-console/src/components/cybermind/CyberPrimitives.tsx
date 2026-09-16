'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { 
  AlertCircle, 
  RefreshCw, 
  Inbox, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowUpRight, 
  Clock, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

/* ==========================================================================
   1. CYBER PAGE HEADER
   ========================================================================== */
export interface CyberPageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export function CyberPageHeader({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  className = '',
}: CyberPageHeaderProps) {
  return (
    <div className={`space-y-2 pb-4 border-b border-slate-800/80 mb-6 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-cyan-400 transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-slate-300 font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 font-mono">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   2. CYBER CARD & METRIC
   ========================================================================== */
export interface CyberCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function CyberCard({ children, className = '', hoverEffect = false }: CyberCardProps) {
  return (
    <div
      className={`bg-slate-950/80 border border-slate-800/80 rounded-lg shadow-sm transition-all duration-150 ${
        hoverEffect ? 'hover:border-slate-700/80 hover:bg-slate-900/50' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export interface CyberMetricProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive?: boolean };
  badge?: React.ReactNode;
  className?: string;
  accentColor?: 'red' | 'orange' | 'yellow' | 'emerald' | 'cyan' | 'blue' | 'slate';
}

export function CyberMetric({
  title,
  value,
  subtitle,
  icon,
  trend,
  badge,
  className = '',
  accentColor = 'slate',
}: CyberMetricProps) {
  const accentClasses = {
    red: 'border-l-4 border-l-red-500',
    orange: 'border-l-4 border-l-orange-500',
    yellow: 'border-l-4 border-l-yellow-500',
    emerald: 'border-l-4 border-l-emerald-500',
    cyan: 'border-l-4 border-l-cyan-500',
    blue: 'border-l-4 border-l-blue-500',
    slate: 'border-l-2 border-l-slate-700',
  };

  return (
    <div
      className={`bg-slate-950/90 border border-slate-800/80 rounded-lg p-4 transition-all ${accentClasses[accentColor]} ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {icon && <div className="text-slate-400 shrink-0 w-4 h-4">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-100">
          {value}
        </span>
        {badge}
      </div>

      {(subtitle || trend) && (
        <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 font-mono">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={`inline-flex items-center font-semibold ${
                trend.positive ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   3. CYBER EMPTY & ERROR STATES
   ========================================================================== */
export interface CyberEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function CyberEmptyState({
  title,
  description,
  icon = <Inbox className="w-8 h-8 text-slate-600 shrink-0" />,
  action,
  className = '',
}: CyberEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-800 rounded-lg bg-slate-950/40 ${className}`}>
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-full mb-3 shrink-0">
        {icon}
      </div>
      <h3 className="text-sm font-semibold font-mono text-slate-200">{title}</h3>
      <p className="text-xs text-slate-400 max-w-md mt-1 mb-4 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}

export interface CyberErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function CyberErrorState({
  title = 'Failed to Load Intelligence Data',
  message,
  onRetry,
  className = '',
}: CyberErrorStateProps) {
  return (
    <div className={`p-4 border border-red-500/30 bg-red-950/20 rounded-lg flex items-start gap-3 ${className}`}>
      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-semibold text-red-300 font-mono">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="mt-2 h-7 text-xs border-red-500/40 text-red-300 hover:bg-red-500/20"
          >
            <RefreshCw className="w-3 h-3 mr-1.5 shrink-0" />
            Retry Request
          </Button>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   4. CYBER SKELETON LOADER
   ========================================================================== */
export function CyberSkeleton({ className = '' }: { className?: string }) {
  return <Skeleton className={`bg-slate-800/60 animate-pulse rounded ${className}`} />;
}

export function CyberTableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 w-full">
      <CyberSkeleton className="h-9 w-full" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <CyberSkeleton key={c} className="h-7 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   5. CYBER TIMELINE VISUALIZATION
   ========================================================================== */
export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description?: string;
  type?: 'alert' | 'analyst' | 'enrichment' | 'cve' | 'vapt' | 'ai' | 'response';
  user?: string;
}

export function CyberTimeline({ events }: { events: TimelineEvent[] }) {
  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'alert':
        return 'bg-red-500 text-red-200 border-red-400';
      case 'analyst':
        return 'bg-cyan-500 text-cyan-200 border-cyan-400';
      case 'enrichment':
        return 'bg-purple-500 text-purple-200 border-purple-400';
      case 'cve':
        return 'bg-orange-500 text-orange-200 border-orange-400';
      case 'vapt':
        return 'bg-yellow-500 text-yellow-200 border-yellow-400';
      case 'ai':
        return 'bg-blue-500 text-blue-200 border-blue-400';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {events.map((evt) => (
        <div key={evt.id} className="relative group">
          {/* Node Dot */}
          <div
            className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 ${getTypeColor(
              evt.type
            )} shrink-0`}
          />

          <div className="bg-slate-950/80 border border-slate-800/80 rounded p-3 text-xs font-mono space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-cyan-400 font-semibold">{evt.time}</span>
              {evt.user && <span className="text-slate-500">[{evt.user}]</span>}
            </div>
            <div className="font-semibold text-slate-200">{evt.title}</div>
            {evt.description && (
              <p className="text-slate-400 leading-relaxed font-sans text-xs">{evt.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
