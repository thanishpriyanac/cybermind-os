'use client';

import React from 'react';
import { Badge } from '../ui/badge';
import { AlertTriangle, ShieldAlert, ShieldCheck, Activity, CheckCircle2, Clock, Shield, Info, XCircle } from 'lucide-react';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL' | 'INFO';

export interface CyberSeverityBadgeProps {
  severity: SeverityLevel | string;
  showIcon?: boolean;
  className?: string;
}

export function CyberSeverityBadge({ severity, showIcon = true, className = '' }: CyberSeverityBadgeProps) {
  const s = (severity || 'LOW').toUpperCase();

  if (s === 'CRITICAL') {
    return (
      <Badge variant="destructive" className={`bg-red-500/15 text-red-400 border border-red-500/40 font-mono font-bold text-[11px] px-2.5 py-0.5 inline-flex items-center gap-1.5 shrink-0 ${className}`}>
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
        <span>CRITICAL</span>
      </Badge>
    );
  }

  if (s === 'HIGH') {
    return (
      <Badge variant="destructive" className={`bg-orange-500/15 text-orange-400 border border-orange-500/40 font-mono font-bold text-[11px] px-2.5 py-0.5 inline-flex items-center gap-1.5 shrink-0 ${className}`}>
        {showIcon && <ShieldAlert className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
        <span>HIGH</span>
      </Badge>
    );
  }

  if (s === 'MEDIUM') {
    return (
      <Badge variant="secondary" className={`bg-yellow-500/15 text-yellow-400 border border-yellow-500/40 font-mono font-bold text-[11px] px-2.5 py-0.5 inline-flex items-center gap-1.5 shrink-0 ${className}`}>
        {showIcon && <Shield className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
        <span>MEDIUM</span>
      </Badge>
    );
  }

  if (s === 'LOW') {
    return (
      <Badge variant="outline" className={`bg-blue-500/10 text-blue-400 border border-blue-500/40 font-mono font-semibold text-[11px] px-2.5 py-0.5 inline-flex items-center gap-1.5 shrink-0 ${className}`}>
        {showIcon && <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
        <span>LOW</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-medium text-[11px] px-2.5 py-0.5 inline-flex items-center gap-1.5 shrink-0 ${className}`}>
      {showIcon && <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
      <span>INFO</span>
    </Badge>
  );
}

export interface CyberStatusBadgeProps {
  status: string;
  className?: string;
}

export function CyberStatusBadge({ status, className = '' }: CyberStatusBadgeProps) {
  const s = (status || '').toUpperCase();

  if (s === 'HEALTHY' || s === 'OPEN' || s === 'COMPLETED' || s === 'RESOLVED' || s === 'CONFIRMED' || s === 'PASSED') {
    return (
      <Badge className={`bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 font-mono text-[11px] px-2.5 py-0.5 inline-flex items-center gap-1.5 shrink-0 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>{status}</span>
      </Badge>
    );
  }

  if (s === 'DEGRADED' || s === 'RUNNING' || s === 'INVESTIGATING' || s === 'IN_PROGRESS' || s === 'ACTIVE') {
    return (
      <Badge className={`bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 font-mono text-[11px] px-2.5 py-0.5 inline-flex items-center gap-1.5 shrink-0 animate-pulse ${className}`}>
        <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-spin" />
        <span>{status}</span>
      </Badge>
    );
  }

  if (s === 'DOWN' || s === 'CRITICAL' || s === 'FAILED' || s === 'UNRESOLVED') {
    return (
      <Badge variant="destructive" className={`bg-red-500/15 text-red-400 border border-red-500/40 font-mono text-[11px] px-2.5 py-0.5 inline-flex items-center gap-1.5 shrink-0 ${className}`}>
        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
        <span>{status}</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`bg-muted/60 text-muted-foreground border-border font-mono text-[11px] px-2.5 py-0.5 inline-flex items-center gap-1.5 shrink-0 ${className}`}>
      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span>{status}</span>
    </Badge>
  );
}
