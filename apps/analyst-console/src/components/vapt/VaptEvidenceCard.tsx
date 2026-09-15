'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ShieldCheck, ChevronDown, ChevronUp, Copy, Lock } from 'lucide-react';

export interface EvidenceItem {
  id: string;
  source: string;
  endpoint: string;
  observedText: string;
  redactionStatus: 'REDACTED_CONFIRMED' | string;
  timestamp?: string;
  requestHeaders?: string;
  responseHeaders?: string;
}

export interface VaptEvidenceCardProps {
  evidence: EvidenceItem;
  onCopy?: (text: string) => void;
}

export function VaptEvidenceCard({ evidence, onCopy }: VaptEvidenceCardProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Card className="border-border bg-card/90 shadow-sm hover:border-emerald-500/30 transition-colors">
      <CardHeader className="p-4 pb-2 space-y-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{evidence.source || 'Authorized Assessment Evidence'}</span>
          </CardTitle>
          <div className="flex items-center gap-2 font-mono text-xs">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>{evidence.redactionStatus || 'SECRETS REDACTED'}</span>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="text-xs font-mono text-muted-foreground flex items-center gap-2 flex-wrap pt-1">
          <span>Endpoint Target:</span>
          <code className="text-cyan-300 bg-muted/60 px-1.5 py-0.5 rounded border border-border/60 text-[11px] font-bold">
            {evidence.endpoint}
          </code>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="p-4 pt-2 space-y-3 font-mono text-xs">
          {/* Main Observed HTTP Evidence Body */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase">Observed HTTP Telemetry (Redacted):</span>
              {onCopy && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCopy(evidence.observedText)}
                  className="h-6 text-[10px] font-mono gap-1 text-emerald-400 hover:text-emerald-300"
                >
                  <Copy className="h-3 w-3" /> Copy Evidence
                </Button>
              )}
            </div>
            <div className="bg-black/95 p-3.5 rounded-lg border border-border text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed text-[11px] max-h-64 shadow-inner">
              {evidence.observedText}
            </div>
          </div>

          {/* Side-by-side desktop request/response or stacked on mobile */}
          {(evidence.requestHeaders || evidence.responseHeaders) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {evidence.requestHeaders && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">HTTP Request Headers</span>
                  <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 text-[10px] text-zinc-300 overflow-x-auto whitespace-pre-wrap max-h-36">
                    {evidence.requestHeaders}
                  </div>
                </div>
              )}
              {evidence.responseHeaders && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">HTTP Response Headers</span>
                  <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 text-[10px] text-zinc-300 overflow-x-auto whitespace-pre-wrap max-h-36">
                    {evidence.responseHeaders}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
