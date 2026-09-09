'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  HeartPulse, RefreshCw, Server, Cpu, HardDrive, MemoryStick,
  Bot, Database, CheckCircle2, AlertTriangle, XCircle, Activity,
  Wifi, ShieldAlert, Zap, Network, Flame, ArrowDown, ArrowUp
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
  network: {
    rxBytes: number;
    txBytes: number;
    rxGB: string;
    txGB: string;
    totalConsumptionGB: string;
    totalConsumptionMB: number;
    downloadSpeed: string;
    uploadSpeed: string;
    interfaces: Array<{ name: string; ip: string; rxMB: number; txMB: number }>;
  };
  networkSpeed: {
    latencyMs: number;
    status: string;
  };
  sensors: {
    cpuTempC: number | string;
    tempStatus: string;
    clockSpeedGHz: string;
    cpuArchitecture: string;
    cpuCores: number;
    cpuModel: string;
  };
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
  if (status === 'operational' || status === 'ok' || status === 'OPTIMAL' || status === 'NORMAL') {
    return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1">● Operational</Badge>;
  }
  if (status === 'degraded' || status === 'ELEVATED') {
    return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1">⚠ Elevated</Badge>;
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
    refetchInterval: 1000, // AUTO-SYNC EVERY 1 SECOND (REAL-TIME)
    staleTime: 500,
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
            <HeartPulse className="w-7 h-7 text-emerald-500 animate-pulse" />
            System Health & Telemetry
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live hardware sensors, real-time bandwidth speeds, and system telemetry auto-synced every 1 second.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Real-Time: 1s
          </Badge>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 text-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
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
                <p className="text-xs text-muted-foreground mt-1">{health?.sensors?.cpuCores} Cores · {health?.sensors?.clockSpeedGHz} GHz</p>
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

        {/* Real-time Internet Speed */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Real-Time Speed</CardTitle>
            <Zap className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-emerald-400 flex items-center"><ArrowDown className="w-4 h-4 inline" />{health?.network?.downloadSpeed || '0 KB/s'}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-primary inline" /> Upload: <span className="text-foreground font-mono">{health?.network?.uploadSpeed || '0 KB/s'}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Data Consumption & Ping */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Data Usage & Ping</CardTitle>
            <Wifi className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold text-foreground">
                  {health?.network?.totalConsumptionGB} GB
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ping: <span className="text-emerald-400 font-semibold">{health?.networkSpeed?.latencyMs} ms</span> ({health?.networkSpeed?.status})
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hardware Sensors & Network Interfaces Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hardware Sensors */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              Hardware Sensors & Thermal Telemetry
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              CPU temperature zones, frequency stats, and processor info.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-32 w-full" /> : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div>
                    <span className="text-sm font-medium">CPU Thermal Temperature</span>
                    <span className="text-xs text-muted-foreground block font-mono">Linux Thermal Sensor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono">
                      {typeof health?.sensors?.cpuTempC === 'number' ? `${health.sensors.cpuTempC}°C` : health?.sensors?.cpuTempC}
                    </span>
                    <Badge className={
                      health?.sensors?.tempStatus === 'NORMAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      health?.sensors?.tempStatus === 'ELEVATED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      'bg-muted text-muted-foreground'
                    }>
                      {health?.sensors?.tempStatus}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div>
                    <span className="text-sm font-medium">CPU Frequency</span>
                    <span className="text-xs text-muted-foreground block font-mono">Clock Speed & Architecture</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono">{health?.sensors?.clockSpeedGHz} GHz</span>
                    <span className="text-xs text-muted-foreground block font-mono">{health?.sensors?.cpuArchitecture} ({health?.sensors?.cpuCores} cores)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div>
                    <span className="text-sm font-medium">CPU Model</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground max-w-[250px] truncate" title={health?.sensors?.cpuModel}>
                    {health?.sensors?.cpuModel}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Network Interfaces */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              Network Interfaces & Data Consumption
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Interface bindings, IP addresses, and transfer totals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-32 w-full" /> : (
              <div className="space-y-3">
                {health?.network?.interfaces && health.network.interfaces.length > 0 ? (
                  health.network.interfaces.map((iface, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
                      <div>
                        <span className="text-sm font-semibold text-foreground font-mono">{iface.name}</span>
                        <span className="text-xs text-muted-foreground block font-mono">IP: {iface.ip}</span>
                      </div>
                      <div className="text-right text-xs font-mono">
                        <div className="text-emerald-400 font-semibold">Rx: {iface.rxMB} MB</div>
                        <div className="text-primary font-semibold">Tx: {iface.txMB} MB</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Total Network Data: {health?.network?.totalConsumptionGB} GB (Rx: {health?.network?.rxGB} GB, Tx: {health?.network?.txGB} GB)
                  </div>
                )}
              </div>
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
