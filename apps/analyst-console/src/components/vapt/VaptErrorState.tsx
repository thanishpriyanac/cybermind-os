'use client';

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface VaptErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  cachedTimestamp?: string;
}

export function VaptErrorState({
  title = 'Unable to Load Assessment Data',
  message = 'The VAPT assessment subsystem did not respond or encountered a network connection failure.',
  onRetry,
  cachedTimestamp,
}: VaptErrorStateProps) {
  return (
    <Card className="border-red-500/40 bg-red-500/5 p-6 sm:p-8 text-center shadow-sm">
      <CardContent className="max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <div className="space-y-1 font-mono">
          <h3 className="text-base font-bold text-red-400">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
          {cachedTimestamp && (
            <p className="text-[10px] text-amber-400/80 pt-1">
              Showing cached assessment telemetry from: {cachedTimestamp}
            </p>
          )}
        </div>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="border-red-500/40 text-red-300 hover:bg-red-500/10 font-mono text-xs gap-2 h-9 px-4"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Connection</span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
