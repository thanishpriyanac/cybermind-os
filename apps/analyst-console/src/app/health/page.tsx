'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  HeartPulse, RefreshCw, Server, Cpu, HardDrive, MemoryStick,
  Bot, Database, CheckCircle2, AlertTriangle, XCircle, Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

interface HealthData {
  timestamp: string;
  server: {
    hostname: string;
    platform: string;
    arch: string;
    uptime: string;
    loadAvg: string[];
    cpuCount: number;
    cpuModel: string;
  };
  cpu: { usagePct: number; count: number };
  memory: { totalMB: number; usedMB: number; freeMB: number; usedPct: number };
  disk: { totalGB: string; usedGB: string; freeGB: string; usedPct: number };
  nodeProcess: {
    pid: number;
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
    uptimeSeconds: number;
    nodeVersion: string;
  };
  aiProviders: Array<{ name: string; status: string; latencyMs?: number }>;
  dataStores: Record<string, { exists: boolean; sizeKB?: number; records?: number }>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'operational' || status === 'ok') {
    return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1">● Operational</Badge>;
  }
  if (status === 'degraded') {
    return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1">⚠ Degraded</Badge>;
  }
  if (status === 'not_configured') {
    return <Badge variant="outline" className="text-muted-foreground px-3 py-1">Not Configured</Badge>;
  }
  return <Badge className="bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1">✕ Error</Badge>;
}

function UsageBar({ pct, colorClass }: { pct: number; colorClass: string }) {
  return (
    <div className="w-full bg-muted rounded-full h-2 mt-2">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function getBarColor(pct: number) {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export default function HealthPage() {
  const { data: health, isLoading, error, refetch, isFetching } = useQuery<HealthData>({
    queryKey: ['system-health-real'],
    queryFn: async () => {
      const res = await api.get('/v1/health');
      return res.data;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const storeNames: Record<string, string> = {
    'copilot_store.json': 'AI Chat History',
    'cve_store.json': 'CVE Intelligence',
    'ip_store.json': 'IP Investigations',
    'firewall_store.json': 'FW Assessments',
    'qbr_store.json': 'QBR Reports',
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HeartPulse className="w-7 h-7 text-emerald-500" />
            System Health & Telemetry
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time server metrics — CPU, memory, disk, Node.js process, and AI provider status.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 text-xs self-start sm:self-center"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          Failed to load health metrics. Ensure the server is running.
        </div>
      )}

      {/* Server Info Banner */}
      {health && (
        <div className="p-3 bg-muted/30 border border-border rounded-lg flex flex-wrap gap-4 text-xs text-muted-foreground font-mono">
          <span>🖥 <strong className="text-foreground">{health.server.hostname}</strong></span>
          <span>📡 {health.server.platform}/{health.server.arch}</span>
          <span>⏱ Uptime: <strong className="text-foreground">{health.server.uptime}</strong></span>
          <span>🔧 Node {health.nodeProcess.nodeVersion} (PID {health.nodeProcess.pid})</span>
          <span>⚡ Load: {health.server.loadAvg.join(' / ')}</span>
          <span className="ml-auto text-[10px]">Updated: {new Date(health.timestamp).toLocaleTimeString()}</span>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">CPU Usage</CardTitle>
            <Cpu className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className={`text-2xl font-bold ${health && health.cpu.usagePct >= 80 ? 'text-red-400' : health && health.cpu.usagePct >= 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {health?.cpu.usagePct ?? '--'}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">{health?.server.cpuCount} cores · {health?.server.cpuModel.split('@')[0].trim()}</p>
                {health && <UsageBar pct={health.cpu.usagePct} colorClass={getBarColor(health.cpu.usagePct)} />}
              </>
            )}
          </CardContent>
        </Card>

        {/* Memory */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Memory (RAM)</CardTitle>
            <MemoryStick className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className={`text-2xl font-bold ${health && health.memory.usedPct >= 85 ? 'text-red-400' : health && health.memory.usedPct >= 70 ? 'text-amber-400' : 'text-primary'}`}>
                  {health?.memory.usedMB ?? '--'} MB
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {health?.memory.usedPct}% of {health?.memory.totalMB} MB
                </p>
                {health && <UsageBar pct={health.memory.usedPct} colorClass={getBarColor(health.memory.usedPct)} />}
              </>
            )}
          </CardContent>
        </Card>

        {/* Disk */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Disk (Root /)</CardTitle>
            <HardDrive className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className={`text-2xl font-bold ${health && health.disk.usedPct >= 85 ? 'text-red-400' : health && health.disk.usedPct >= 70 ? 'text-amber-400' : 'text-foreground'}`}>
                  {health?.disk.usedGB} GB
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {health?.disk.usedPct}% of {health?.disk.totalGB} GB total
                </p>
                {health && <UsageBar pct={health.disk.usedPct} colorClass={getBarColor(health.disk.usedPct)} />}
              </>
            )}
          </CardContent>
        </Card>

        {/* Node.js Process */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Next.js Process</CardTitle>
            <Server className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Running
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Heap: {health?.nodeProcess.heapUsedMB}/{health?.nodeProcess.heapTotalMB} MB · RSS: {health?.nodeProcess.rssMB} MB
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Provider Status */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            AI Provider Connectivity
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Live health checks against configured AI provider APIs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {health?.aiProviders.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    {p.latencyMs && (
                      <p className="text-xs text-muted-foreground">Response: {p.latencyMs}ms</p>
                    )}
                    {p.status === 'not_configured' && (
                      <p className="text-xs text-muted-foreground">No API key configured</p>
                    )}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Stores */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Intelligence Data Stores
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            File-based JSON stores on disk — path: <code className="font-mono">data/</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {health && Object.entries(health.dataStores).map(([file, info]) => (
                <div key={file} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div>
                    <p className="text-sm font-medium text-foreground">{storeNames[file] || file}</p>
                    <p className="text-xs text-muted-foreground font-mono">{file}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-right">
                    {info.exists ? (
                      <>
                        <span className="text-muted-foreground">{info.records ?? 0} records · {info.sizeKB} KB</span>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">● Active</Badge>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Not Created</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
