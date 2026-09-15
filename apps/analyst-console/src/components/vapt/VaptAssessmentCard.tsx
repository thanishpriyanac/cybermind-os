'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { VaptRiskBadge, VaptStatusBadge } from './VaptBadges';
import { Lock, ChevronRight, Globe, Server, Cloud, Layers } from 'lucide-react';

export interface AssessmentItem {
  id: string;
  name: string;
  target: string;
  targetType: 'web_app' | 'api' | 'network' | 'cloud' | string;
  overallRiskScore: number;
  findingsCount: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
    total?: number;
  };
  status: string;
  authorization?: {
    reference?: string;
  };
  environment?: string;
  owaspTags?: string[];
}

export interface VaptAssessmentCardProps {
  assessment: AssessmentItem;
}

export function VaptAssessmentCard({ assessment }: VaptAssessmentCardProps) {
  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'web_app': return <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />;
      case 'api': return <Layers className="h-3.5 w-3.5 text-purple-400 shrink-0" />;
      case 'network': return <Server className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
      case 'cloud': return <Cloud className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
      default: return <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />;
    }
  };

  const critical = assessment.findingsCount?.critical || 0;
  const high = assessment.findingsCount?.high || 0;
  const medium = assessment.findingsCount?.medium || 0;
  const total = assessment.findingsCount?.total || (critical + high + medium);

  return (
    <Card className="border-border bg-card/90 hover:border-primary/50 transition-colors shadow-sm">
      <CardContent className="p-4 space-y-3">
        {/* Header: Name + Risk Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground truncate">{assessment.name}</span>
              {assessment.environment === 'DEMO' && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[9px] shrink-0 font-mono">DEMO</Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono truncate">
              {getTargetIcon(assessment.targetType)}
              <span className="truncate">{assessment.target}</span>
            </div>
          </div>
          <VaptRiskBadge score={assessment.overallRiskScore || 0} className="shrink-0 text-xs" />
        </div>

        {/* Info Grid: Risk Score, Findings, Status */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-muted/40 rounded-lg border border-border/60 text-xs font-mono">
          <div>
            <span className="text-[10px] text-muted-foreground block uppercase">Risk Score</span>
            <span className="font-extrabold text-foreground text-sm">{assessment.overallRiskScore || 0} / 100</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block uppercase">Findings</span>
            <span className="font-bold text-foreground text-sm">{total} Issues</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block uppercase">Status</span>
            <VaptStatusBadge status={assessment.status} className="mt-0.5 text-[10px] py-0.5 px-1.5" />
          </div>
        </div>

        {/* OWASP & Authorization Details */}
        <div className="flex items-center justify-between text-xs font-mono pt-1 text-muted-foreground flex-wrap gap-2">
          <div className="flex items-center gap-1 text-emerald-400 text-[11px]">
            <Lock className="h-3 w-3 shrink-0" />
            <span className="truncate">{assessment.authorization?.reference || 'AUTH-OK'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            {critical > 0 && <span className="text-red-400 font-bold">{critical} Crit</span>}
            {high > 0 && <span className="text-orange-400 font-bold">{high} High</span>}
            {medium > 0 && <span className="text-yellow-400">{medium} Med</span>}
          </div>
        </div>

        {/* Touch Target Action Button (Min 44px height) */}
        <Link href={`/vapt/${assessment.id}`} className="block pt-1">
          <Button 
            className="w-full h-11 text-xs font-semibold gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 justify-between px-4"
          >
            <span>View Assessment Report</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
