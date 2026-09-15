'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Shield, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface VaptCveCardProps {
  cveId: string;
  cvss?: number;
  isKev?: boolean;
  title?: string;
  affectedAsset?: string;
  affectedVersion?: string;
  description?: string;
}

export function VaptCveCard({
  cveId,
  cvss = 9.8,
  isKev = true,
  title = 'Active Pre-Auth Remote Code Execution',
  affectedAsset = 'Payment Gateway API',
  affectedVersion = 'v2.4.1 - v2.4.8',
  description = 'Unauthenticated remote code execution flaw actively targeted in ransomware campaigns.',
}: VaptCveCardProps) {
  return (
    <Card className="border-border bg-card/90 hover:border-orange-500/40 transition-colors shadow-sm">
      <CardContent className="p-4 space-y-2.5 font-mono text-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Link href={`/cve/${cveId}`} className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              <Shield className="w-4 h-4 text-orange-400" />
              <span>{cveId}</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {isKev && (
              <Badge className="bg-red-500/20 text-red-300 border-red-500/40 text-[10px] font-mono flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span>CISA KEV EXPLOITED</span>
              </Badge>
            )}
            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-[10px]">
              CVSS {cvss}
            </Badge>
          </div>
        </div>

        {title && <p className="text-xs font-semibold text-foreground font-sans">{title}</p>}

        <div className="grid grid-cols-2 gap-2 p-2 bg-muted/40 rounded border border-border/60 text-[11px]">
          <div>
            <span className="text-muted-foreground block text-[9px] uppercase">Affected Asset</span>
            <span className="font-bold text-foreground truncate block">{affectedAsset}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[9px] uppercase">Affected Version</span>
            <span className="font-bold text-cyan-300 truncate block">{affectedVersion}</span>
          </div>
        </div>

        {description && <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>}
      </CardContent>
    </Card>
  );
}
