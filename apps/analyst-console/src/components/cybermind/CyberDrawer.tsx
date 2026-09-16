'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

export interface CyberDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  widthClass?: string; // e.g. 'max-w-xl' or 'max-w-2xl'
}

export function CyberDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  actions,
  widthClass = 'max-w-xl',
}: CyberDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Drawer Container (Right slide-over desktop, full-screen mobile) */}
      <div className={`relative w-full ${widthClass} bg-card border-l border-border/80 shadow-2xl z-10 flex flex-col h-full animate-in slide-in-from-right-5 duration-200`}>
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/80 bg-muted/30 shrink-0">
          <div className="space-y-0.5 min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold font-mono text-foreground truncate">{title}</h2>
              {badge}
            </div>
            {subtitle && <p className="text-xs font-mono text-muted-foreground truncate">{subtitle}</p>}
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 font-mono text-xs">
          {children}
        </div>

        {/* Drawer Footer Actions */}
        {actions && (
          <div className="p-4 border-t border-border bg-muted/40 shrink-0 flex items-center justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
