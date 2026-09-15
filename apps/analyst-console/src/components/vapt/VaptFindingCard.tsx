'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { VaptRiskBadge } from './VaptBadges';
import { ChevronDown, ChevronUp, ExternalLink, ShieldAlert, Code, CheckCircle2, AlertTriangle, Copy } from 'lucide-react';

export interface FindingItem {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  cvss: number;
  owaspCategory: string;
  cwe: string;
  endpoint: string;
  verificationStatus: 'CONFIRMED' | 'UNVERIFIED' | string;
  status?: string;
  description?: string;
  remediation?: string;
  cveIds?: string[];
}

export interface VaptFindingCardProps {
  finding: FindingItem;
  onCopyRemediation?: (text: string) => void;
}

export function VaptFindingCard({ finding, onCopyRemediation }: VaptFindingCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-border bg-card/90 hover:border-primary/40 transition-colors shadow-sm">
      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 flex-wrap">
            <VaptRiskBadge score={finding.cvss >= 9 ? 90 : finding.cvss >= 7 ? 75 : finding.cvss >= 4 ? 50 : 25} showScore={false} />
            <Badge variant="outline" className="font-mono text-[10px] bg-muted/60 text-foreground border-border">
              CVSS {finding.cvss}
            </Badge>
            <Badge variant="outline" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              {finding.verificationStatus}
            </Badge>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">{finding.status || 'OPEN'}</span>
        </div>

        <CardTitle className="text-sm font-bold text-foreground leading-snug">{finding.title}</CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-1 space-y-3">
        {/* Core Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 p-2.5 bg-muted/40 rounded-lg border border-border/60 text-xs font-mono">
          <div>
            <span className="text-[10px] text-muted-foreground block uppercase">OWASP Category</span>
            <span className="font-bold text-cyan-400">{finding.owaspCategory}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block uppercase">CWE Reference</span>
            <span className="font-bold text-purple-300">{finding.cwe}</span>
          </div>
          <div className="col-span-2">
            <span className="text-[10px] text-muted-foreground block uppercase">Target Endpoint</span>
            <code className="text-cyan-300 text-[11px] truncate block">{finding.endpoint}</code>
          </div>
        </div>

        {/* CVE Correlations */}
        {finding.cveIds && finding.cveIds.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-mono flex-wrap">
            <span className="text-orange-400 text-[11px] font-bold">CVE:</span>
            {finding.cveIds.map((cve) => (
              <Link key={cve} href={`/cve/${cve}`} className="text-primary hover:underline text-[11px] font-bold">
                {cve}
              </Link>
            ))}
          </div>
        )}

        {/* Description snippet */}
        {finding.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{finding.description}</p>
        )}

        {/* Collapsible Inspection Details & Remediation */}
        {expanded && (
          <div className="space-y-3 pt-2 border-t border-border animate-in fade-in">
            {finding.description && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-foreground font-mono">Technical Threat Description:</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{finding.description}</p>
              </div>
            )}

            {finding.remediation && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 font-mono flex items-center gap-1">
                    <Code className="h-3.5 w-3.5" />
                    Developer Fix Guidance:
                  </span>
                  {onCopyRemediation && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCopyRemediation(finding.remediation!)}
                      className="h-6 text-[10px] font-mono gap-1 text-emerald-400 hover:text-emerald-300"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                  )}
                </div>
                <div className="p-3 bg-black/90 rounded border border-border font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                  {finding.remediation}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Toggle Inspection Action */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full h-9 text-xs font-mono gap-1 text-primary hover:text-primary/90 justify-center border border-border/60 mt-1"
        >
          <span>{expanded ? 'Hide Technical Details' : 'View Finding & Remediation'}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardContent>
    </Card>
  );
}
