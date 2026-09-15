'use client';

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Activity, AlertTriangle, ShieldAlert, FileText, ShieldCheck } from 'lucide-react';

export interface VaptSummaryCardProps {
  totalAssessments: number;
  criticalFindings: number;
  highFindings: number;
  openFindings: number;
  isLoading?: boolean;
}

export function VaptSummaryCard({
  totalAssessments,
  criticalFindings,
  highFindings,
  openFindings,
  isLoading = false,
}: VaptSummaryCardProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Assessments */}
      <Card className="border-border bg-card/70 backdrop-blur-md p-3.5 sm:p-4 hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Assessments</span>
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">{totalAssessments}</span>
          )}
          <span className="text-[10px] text-muted-foreground font-mono">Active Scope</span>
        </div>
      </Card>

      {/* Critical Risk Findings */}
      <Card className="border-red-500/30 bg-red-500/5 p-3.5 sm:p-4 hover:border-red-500/50 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-red-400 uppercase tracking-wider">Critical</span>
          <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-red-400">{criticalFindings}</span>
          )}
          <span className="text-[10px] text-red-300/80 font-mono">Immediate Fix</span>
        </div>
      </Card>

      {/* High Risk Vulnerabilities */}
      <Card className="border-orange-500/30 bg-orange-500/5 p-3.5 sm:p-4 hover:border-orange-500/50 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-orange-400 uppercase tracking-wider">High Risk</span>
          <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
            <ShieldAlert className="h-4 w-4 text-orange-400" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-orange-400">{highFindings}</span>
          )}
          <span className="text-[10px] text-orange-300/80 font-mono">P1 Action</span>
        </div>
      </Card>

      {/* Open Findings */}
      <Card className="border-purple-500/30 bg-purple-500/5 p-3.5 sm:p-4 hover:border-purple-500/50 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-medium text-purple-400 uppercase tracking-wider">Open Findings</span>
          <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
            <FileText className="h-4 w-4 text-purple-400" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-300">{openFindings}</span>
          )}
          <span className="text-[10px] text-purple-300/80 font-mono">OWASP & CVE</span>
        </div>
      </Card>
    </div>
  );
}
