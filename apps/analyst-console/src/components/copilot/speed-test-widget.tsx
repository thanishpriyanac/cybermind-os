'use client';

import { useState } from 'react';
import { Activity, ArrowDown, ArrowUp, Gauge, RefreshCw, Wifi } from 'lucide-react';

interface SpeedTestResult {
  latencyMs: number;
  downloadSpeedMbps: number;
  uploadSpeedMbps: number;
  jitterMs: number;
  networkQuality: 'EXCELLENT' | 'GOOD' | 'DEGRADED';
  status: string;
  recommendation: string;
}

export function SpeedTestWidget() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SpeedTestResult | null>(null);

  const runTest = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/v1/ai/tools/speed-test');
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (e) {
      console.error('Speed test failed:', e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-4 border border-border bg-card text-card-foreground rounded-lg shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Network Speed & Latency Test</h3>
        </div>
        <button
          onClick={runTest}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs rounded-md font-medium disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Testing...' : 'Run Test'}
        </button>
      </div>

      {result ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-muted/50 p-2.5 rounded-md border border-border">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <ArrowDown className="w-3.5 h-3.5 text-emerald-500" />
              Download
            </div>
            <div className="text-lg font-bold text-foreground">
              {result.downloadSpeedMbps} <span className="text-xs font-normal text-muted-foreground">Mbps</span>
            </div>
          </div>

          <div className="bg-muted/50 p-2.5 rounded-md border border-border">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <ArrowUp className="w-3.5 h-3.5 text-blue-500" />
              Upload
            </div>
            <div className="text-lg font-bold text-foreground">
              {result.uploadSpeedMbps} <span className="text-xs font-normal text-muted-foreground">Mbps</span>
            </div>
          </div>

          <div className="bg-muted/50 p-2.5 rounded-md border border-border">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Wifi className="w-3.5 h-3.5 text-amber-500" />
              Latency
            </div>
            <div className="text-lg font-bold text-foreground">
              {result.latencyMs} <span className="text-xs font-normal text-muted-foreground">ms</span>
            </div>
          </div>

          <div className="bg-muted/50 p-2.5 rounded-md border border-border">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Activity className="w-3.5 h-3.5 text-purple-500" />
              Jitter
            </div>
            <div className="text-lg font-bold text-foreground">
              {result.jitterMs} <span className="text-xs font-normal text-muted-foreground">ms</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-xs text-muted-foreground border border-dashed border-border rounded-md">
          Click "Run Test" to measure real-time SIEM network throughput & ping.
        </div>
      )}
    </div>
  );
}
