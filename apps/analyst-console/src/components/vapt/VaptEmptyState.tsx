'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ShieldAlert, Plus, ShieldCheck } from 'lucide-react';

export interface VaptEmptyStateProps {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}

export function VaptEmptyState({
  title = 'No VAPT Security Assessments Yet',
  description = 'Create your first authorized security assessment to begin scanning your attack surface for OWASP Top 10 vulnerabilities, redacted evidence, and CVE correlations.',
  actionHref = '/vapt/new',
  actionLabel = 'New Authorized Assessment',
}: VaptEmptyStateProps) {
  return (
    <Card className="border-border bg-card/60 backdrop-blur-md p-8 sm:p-12 text-center shadow-sm">
      <CardContent className="max-w-md mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
          <ShieldCheck className="w-8 h-8 text-cyan-400" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
        {actionHref && (
          <Link href={actionHref} className="inline-block pt-2">
            <Button className="bg-primary text-black hover:bg-primary/90 font-bold text-xs h-10 px-5 gap-2 shadow-md">
              <Plus className="h-4 w-4" />
              <span>{actionLabel}</span>
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
