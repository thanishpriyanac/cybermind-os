'use client';

import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Search, SlidersHorizontal, X, Filter } from 'lucide-react';

export interface VaptFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  targetTypeFilter: string;
  onTargetTypeChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  riskFilter: string;
  onRiskChange: (value: string) => void;
  onClearFilters: () => void;
}

export function VaptFilterBar({
  search,
  onSearchChange,
  targetTypeFilter,
  onTargetTypeChange,
  statusFilter,
  onStatusChange,
  riskFilter,
  onRiskChange,
  onClearFilters,
}: VaptFilterBarProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const hasActiveFilters = targetTypeFilter !== 'ALL' || statusFilter !== 'ALL' || riskFilter !== 'ALL' || search.trim() !== '';

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search target domain, authorization ticket, or assessment name..."
            className="pl-9 text-xs font-mono bg-card/80 border-border h-9"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Desktop Filter Controls (Inline) */}
        <div className="hidden lg:flex items-center gap-2 overflow-x-auto">
          {/* Target Type Filter */}
          <div className="flex items-center gap-1 bg-card/80 p-1 rounded-md border border-border">
            {['ALL', 'web_app', 'api', 'network', 'cloud'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onTargetTypeChange(type)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                  targetTypeFilter === type
                    ? 'bg-primary text-black font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {type === 'ALL' ? 'All Scopes' : type.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-9 px-2.5 rounded-md border border-border bg-card text-xs font-mono text-foreground focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="RUNNING">Running</option>
            <option value="DRAFT">Draft</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => onRiskChange(e.target.value)}
            className="h-9 px-2.5 rounded-md border border-border bg-card text-xs font-mono text-foreground focus:outline-none"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk (80+)</option>
            <option value="HIGH">High Risk (60+)</option>
            <option value="MEDIUM">Medium Risk (40+)</option>
            <option value="LOW">Low Risk (&lt; 40)</option>
          </select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-9 px-2 text-xs font-mono text-muted-foreground hover:text-foreground">
              Clear
            </Button>
          )}
        </div>

        {/* Mobile / Tablet Filter Drawer Button (< 1024px lg breakpoint) */}
        <div className="flex lg:hidden items-center justify-between w-full sm:w-auto gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileDrawerOpen(true)}
            className="h-9 text-xs font-mono gap-1.5 w-full sm:w-auto border-border bg-card"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <span>Filters</span>
            {hasActiveFilters && (
              <Badge className="bg-primary text-black font-mono text-[9px] px-1.5 py-0">Active</Badge>
            )}
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-9 px-2 text-xs font-mono text-muted-foreground">
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet / Drawer Overlay */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-card border-t sm:border border-border rounded-t-2xl sm:rounded-xl p-5 space-y-4 z-10 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm">Filter VAPT Assessments</h3>
              </div>
              <button 
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scope Type Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground uppercase">Target Scope Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['ALL', 'web_app', 'api', 'network', 'cloud'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onTargetTypeChange(type)}
                    className={`h-10 px-3 rounded-lg border text-xs font-mono text-left transition-colors ${
                      targetTypeFilter === type
                        ? 'border-primary bg-primary/10 font-bold text-primary'
                        : 'border-border bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    {type === 'ALL' ? 'All Scopes' : type.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground uppercase">Assessment Status</label>
              <select
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-muted/40 text-xs font-mono text-foreground focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="RUNNING">Running</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>

            {/* Risk Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground uppercase">Risk Severity</label>
              <select
                value={riskFilter}
                onChange={(e) => onRiskChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-muted/40 text-xs font-mono text-foreground focus:outline-none"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="CRITICAL">Critical Risk (80+)</option>
                <option value="HIGH">High Risk (60+)</option>
                <option value="MEDIUM">Medium Risk (40+)</option>
                <option value="LOW">Low Risk (&lt; 40)</option>
              </select>
            </div>

            {/* Drawer Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1 h-11 text-xs font-mono"
                onClick={() => {
                  onClearFilters();
                  setMobileDrawerOpen(false);
                }}
              >
                Clear All
              </Button>
              <Button 
                className="flex-1 h-11 text-xs font-mono bg-primary text-black font-bold"
                onClick={() => setMobileDrawerOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
