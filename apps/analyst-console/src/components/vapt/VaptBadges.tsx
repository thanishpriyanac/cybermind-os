'use client';

import React from 'react';
import { Badge } from '../ui/badge';
import { ShieldAlert, AlertTriangle, ShieldCheck, Activity, CheckCircle2, Clock, Lock, Shield } from 'lucide-react';

export interface VaptRiskBadgeProps {
  score: number;
  showScore?: boolean;
  className?: string;
}

export function VaptRiskBadge({ score, showScore = true, className = '' }: VaptRiskBadgeProps) {
  if (score >= 80) {
    return (
      <Badge variant="destructive" className={`bg-red-500/15 text-red-400 border border-red-500/40 font-mono font-bold flex items-center gap-1.5 px-2.5 py-1 ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
        <span>CRITICAL{showScore ? ` (${score})` : ''}</span>
      </Badge>
    );
  }
  if (score >= 60) {
    return (
      <Badge variant="destructive" className={`bg-orange-500/15 text-orange-400 border border-orange-500/40 font-mono font-bold flex items-center gap-1.5 px-2.5 py-1 ${className}`}>
        <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-orange-400" />
        <span>HIGH{showScore ? ` (${score})` : ''}</span>
      </Badge>
    );
  }
  if (score >= 40) {
    return (
      <Badge variant="secondary" className={`bg-yellow-500/15 text-yellow-400 border border-yellow-500/40 font-mono font-bold flex items-center gap-1.5 px-2.5 py-1 ${className}`}>
        <Shield className="w-3.5 h-3.5 shrink-0 text-yellow-400" />
        <span>MEDIUM{showScore ? ` (${score})` : ''}</span>
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={`bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 font-mono font-semibold flex items-center gap-1.5 px-2.5 py-1 ${className}`}>
      <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
      <span>LOW{showScore ? ` (${score})` : ''}</span>
    </Badge>
  );
}

export interface VaptStatusBadgeProps {
  status: 'COMPLETED' | 'RUNNING' | 'DRAFT' | 'PENDING' | 'CANCELLED' | string;
  className?: string;
}

export function VaptStatusBadge({ status, className = '' }: VaptStatusBadgeProps) {
  const s = status.toUpperCase();
  if (s === 'COMPLETED') {
    return (
      <Badge className={`bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 font-mono font-medium flex items-center gap-1.5 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
        <span>Completed</span>
      </Badge>
    );
  }
  if (s === 'RUNNING') {
    return (
      <Badge className={`bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 font-mono font-medium flex items-center gap-1.5 animate-pulse ${className}`}>
        <Activity className="w-3.5 h-3.5 shrink-0 text-cyan-400 animate-spin" />
        <span>Running</span>
      </Badge>
    );
  }
  if (s === 'DRAFT' || s === 'PENDING') {
    return (
      <Badge variant="outline" className={`bg-muted/60 text-muted-foreground border-border font-mono font-medium flex items-center gap-1.5 ${className}`}>
        <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        <span>{s === 'DRAFT' ? 'Draft' : 'Pending'}</span>
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={`bg-zinc-800 text-zinc-400 border-zinc-700 font-mono flex items-center gap-1.5 ${className}`}>
      <span>{status}</span>
    </Badge>
  );
}
