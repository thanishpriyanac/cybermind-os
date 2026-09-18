'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, Lock, ArrowLeft, Bot, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/auth-context';

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const userEmail = user?.email || searchParams.get('user') || 'saravanan@cybermind.io';
  const attemptedModule = searchParams.get('module') || 'QBR Reports / Firewall Health Check';

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center font-mono">
      <div className="max-w-md w-full bg-card/90 border border-red-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6 relative overflow-hidden">
        {/* Glow Ambient Effect */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Error Badge */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-inner">
            <Lock className="w-7 h-7 text-red-400" />
          </div>
          <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[11px] px-3 py-1 font-mono tracking-wider uppercase">
            HTTP 403 — ACCESS RESTRICTED
          </Badge>
        </div>

        {/* Header Text */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-wider text-foreground">
            Module Access Denied
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Access to <strong className="text-amber-400">{attemptedModule}</strong> has been restricted for your security role.
          </p>
        </div>

        {/* User Detail Box */}
        <div className="bg-muted/40 border border-border/80 rounded-xl p-3.5 text-left text-xs space-y-1.5 font-mono">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Restricted Account:</span>
            <span className="font-bold text-cyan-400">{userEmail}</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Assigned Role:</span>
            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400 bg-amber-500/10">
              RESTRICTED ANALYST
            </Badge>
          </div>
          <div className="flex justify-between items-center text-muted-foreground pt-1 border-t border-border/40">
            <span>Security Policy:</span>
            <span className="text-red-400 font-semibold">QBR & Firewall Modules Blocked</span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 justify-center">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="sm" className="w-full text-xs font-mono bg-primary text-primary-foreground font-bold hover:bg-primary/90">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              SOC Command Dashboard
            </Button>
          </Link>
          <Link href="/copilot" className="w-full sm:w-auto">
            <Button size="sm" variant="outline" className="w-full text-xs font-mono border-border hover:bg-muted">
              <Bot className="w-3.5 h-3.5 mr-1.5 text-cyan-400 shrink-0" />
              Ask CyberAI
            </Button>
          </Link>
        </div>

        <p className="text-[10px] text-muted-foreground/60 pt-2">
          Contact your SOC Administrator if you believe this restriction is an error.
        </p>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex flex-col items-center justify-center font-mono text-xs text-muted-foreground space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
        <span>Evaluating Security Authorization Policies...</span>
      </div>
    }>
      <AccessDeniedContent />
    </Suspense>
  );
}
