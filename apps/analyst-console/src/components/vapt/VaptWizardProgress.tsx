'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface VaptWizardProgressProps {
  currentStep: number;
  steps: { id: number; title: string; subtitle?: string }[];
}

export function VaptWizardProgress({ currentStep, steps }: VaptWizardProgressProps) {
  const currentStepItem = steps.find((s) => s.id === currentStep) || steps[0];

  return (
    <div className="space-y-4">
      {/* Mobile Compact Progress Header (< 640px sm breakpoint) */}
      <div className="block sm:hidden bg-card/90 border border-border p-3.5 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-primary font-bold tracking-wider uppercase">
            STEP {currentStep} OF {steps.length}
          </span>
          <span className="text-foreground font-semibold">{currentStepItem.title}</span>
        </div>

        {/* Compact Dot Progress Indicator: ● ● ○ ○ ○ */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          {steps.map((s) => {
            const isDone = s.id < currentStep;
            const isCurrent = s.id === currentStep;
            return (
              <div
                key={s.id}
                className={`flex-1 h-2 rounded-full transition-all ${
                  isDone
                    ? 'bg-emerald-400'
                    : isCurrent
                    ? 'bg-primary animate-pulse'
                    : 'bg-muted/60'
                }`}
                title={`Step ${s.id}: ${s.title}`}
              />
            );
          })}
        </div>
      </div>

      {/* Desktop / Tablet Progress Bar (>= 640px sm breakpoint) */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between border-b border-border pb-4 font-mono text-xs">
          {steps.map((s) => {
            const isCurrent = s.id === currentStep;
            const isDone = s.id < currentStep;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-2 transition-colors ${
                  isCurrent
                    ? 'text-primary font-bold'
                    : isDone
                    ? 'text-emerald-400 font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isCurrent
                      ? 'bg-primary text-black font-extrabold shadow-sm'
                      : 'bg-muted/80 text-muted-foreground border border-border'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : s.id}
                </div>
                <span>{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
