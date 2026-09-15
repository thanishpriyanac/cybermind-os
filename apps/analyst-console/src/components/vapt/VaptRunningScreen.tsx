'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Activity, StopCircle, ChevronDown, ChevronUp, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

export interface ActivityLogItem {
  timestamp: string;
  message: string;
}

export interface VaptRunningScreenProps {
  target: string;
  progressPercent: number; // e.g. 72
  completedChecks: number; // e.g. 38
  totalChecks: number; // e.g. 52
  findingsCount: number; // e.g. 7
  currentOperation: string;
  activityLogs?: ActivityLogItem[];
  onStopAssessment?: () => void;
  isStopping?: boolean;
}

export function VaptRunningScreen({
  target,
  progressPercent = 72,
  completedChecks = 38,
  totalChecks = 52,
  findingsCount = 7,
  currentOperation = 'Security Configuration Analysis',
  activityLogs = [
    { timestamp: '21:14:02', message: 'Scope validated and locked with cryptographically signed SHA-256 hash' },
    { timestamp: '21:14:04', message: 'Target initialized & TLS cipher suite assessment completed' },
    { timestamp: '21:14:06', message: 'HTTP security headers & CORS policy check finished' },
    { timestamp: '21:14:09', message: 'OWASP Top 10 automated probe sequence active' },
    { timestamp: '21:14:13', message: 'API configuration analysis running' },
  ],
  onStopAssessment,
  isStopping = false,
}: VaptRunningScreenProps) {
  const [activityExpanded, setActivityExpanded] = useState(false);

  return (
    <Card className="border-cyan-500/40 bg-card/90 shadow-lg animate-in fade-in">
      <CardHeader className="p-4 sm:p-6 pb-2">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <CardTitle className="text-base sm:text-lg font-bold font-mono text-cyan-400">
                VAPT ASSESSMENT RUNNING
              </CardTitle>
            </div>
            <CardDescription className="text-xs font-mono text-muted-foreground">
              Target: <code className="text-foreground font-bold">{target}</code>
            </CardDescription>
          </div>

          {onStopAssessment && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onStopAssessment}
              disabled={isStopping}
              className="bg-red-600 hover:bg-red-700 font-mono text-xs gap-1.5 h-10 px-4 w-full sm:w-auto"
            >
              <StopCircle className="h-4 w-4" />
              <span>{isStopping ? 'Stopping...' : 'Stop Assessment'}</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Progress Bar & Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground font-semibold">Assessment Execution Progress</span>
            <span className="text-cyan-400 font-extrabold text-sm">{progressPercent}%</span>
          </div>

          <div className="w-full h-3 bg-muted/80 rounded-full overflow-hidden p-0.5 border border-border">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-primary to-emerald-400 rounded-full transition-all duration-500 animate-pulse"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 3-Col Quick Stats */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-muted/40 rounded-xl border border-border text-center font-mono text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">Security Checks</span>
            <span className="font-extrabold text-foreground text-sm">{completedChecks} / {totalChecks}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">Discovered Findings</span>
            <span className="font-extrabold text-orange-400 text-sm">{findingsCount} Issues</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">Active Phase</span>
            <span className="font-bold text-cyan-300 text-[11px] truncate block">{currentOperation}</span>
          </div>
        </div>

        {/* Live Activity Feed (Collapsible on Mobile) */}
        <div className="space-y-2 pt-1">
          <div 
            onClick={() => setActivityExpanded(!activityExpanded)}
            className="flex items-center justify-between cursor-pointer py-1 text-xs font-mono font-bold text-muted-foreground hover:text-foreground"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span>Live Assessment Activity Stream ({activityLogs.length} Events)</span>
            </div>
            <button className="p-1">
              {activityExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          <div className={`bg-black/90 rounded-xl p-3 border border-border font-mono text-xs space-y-2 overflow-y-auto max-h-48 transition-all ${
            activityExpanded ? 'block' : 'hidden sm:block'
          }`}>
            {activityLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px]">
                <span className="text-muted-foreground shrink-0">[{log.timestamp}]</span>
                <span className="text-cyan-300 leading-tight">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
