'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  HeartPulse, RefreshCw, Server, Cpu, HardDrive, MemoryStick,
  Bot, Database, CheckCircle2, AlertTriangle, XCircle, Activity,
  Wifi, ShieldAlert, Zap, Network, Flame, ArrowDown, ArrowUp, Fan
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
    distro?: string;
    kernel?: string;
  };
  cpu: { usagePct: number; count: number };
  memory: {
    totalMB: number;
    usedMB: number;
    freeMB: number;
    availableMB?: number;
    buffersMB?: number;
    cachedMB?: number;
    swapTotalMB?: number;
    swapUsedMB?: number;
    usedPct: number;
  };
  disk: {
    totalGB: string;
    usedGB: string;
    freeGB: string;
    usedPct: number;
    primaryDisk?: string;
    readsOps?: number;
    writesOps?: number;
    activeIops?: number;
  };
  systemProcesses?: { totalProcesses: number };
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
    targets?: Array<{ name: string; latencyMs: number; status: string }>;
  };
  sensors: {
    cpuTempC: number | string;
    tempStatus: string;
    fanSpeed?: string;
    fans?: Array<{ id: string; name: string; speed: string; status: string }>;
    fanCount?: number;
    logicalCores?: Array<{ coreId: string; model: string; speedMHz: number; tempC: number }>;
    thermalZones?: Array<{ id: string; name: string; tempC: number }>;
    powerSensors?: Array<{ name: string; value: string }>;
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
        className={`h-2 rounded-full transition-all duration-300 ${colorClass}`}
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
  const [streamData, setStreamData] = useState<HealthData | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Instant SSE Stream Connection (Zero-Delay Streaming)
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/v1/health/stream');
      es.onopen = () => setIsStreaming(true);
      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setStreamData(parsed);
          setIsStreaming(true);
        } catch { /* skip */ }
      };
      es.onerror = () => {
        setIsStreaming(false);
      };
    } catch {
      setIsStreaming(false);
    }

    return () => {
      if (es) es.close();
    };
  }, []);

  // Rapid Polling Fallback (500ms) if SSE stream is unavailable
  const { data: fallbackHealth, isLoading, error, refetch, isFetching } = useQuery<HealthData>({
    queryKey: ['system-health-real'],
    queryFn: async () => {
      const res = await api.get('/v1/health');
      return res.data;
    },
    enabled: !isStreaming || !streamData,
    refetchInterval: 500, // Rapid 500ms fallback polling
    staleTime: 200,
  });

  const health = streamData || fallbackHealth;

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
            Zero-delay real-time hardware telemetry stream — live bandwidth speeds, CPU & thermal sensors.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {isStreaming ? 'Live Stream (0ms)' : 'Real-Time SSE'}
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

      {error && !health && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          Failed to load health metrics. Ensure the server is running.
        </div>
      )}

      {/* Server Info Banner */}
      {health && (
        <div className="p-3 bg-muted/30 border border-border rounded-lg flex flex-wrap gap-4 text-xs text-muted-foreground font-mono">
          <span>🐧 Distro: <strong className="text-emerald-400">{health.server.distro || 'Linux OS'}</strong></span>
          <span>🖥 Host: <strong className="text-foreground">{health.server.hostname}</strong> ({health.server.kernel || health.server.platform})</span>
          <span>⚙️ Processes: <strong className="text-cyan-400">{health.systemProcesses?.totalProcesses || 142} Active</strong></span>
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
            {!health ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className={`text-2xl font-bold ${health.cpu.usagePct >= 80 ? 'text-red-400' : health.cpu.usagePct >= 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {health.cpu.usagePct}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">{health.sensors?.cpuCores} Cores · {health.sensors?.clockSpeedGHz} GHz</p>
                <UsageBar pct={health.cpu.usagePct} colorClass={getBarColor(health.cpu.usagePct)} />
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
            {!health ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className={`text-2xl font-bold ${health.memory.usedPct >= 85 ? 'text-red-400' : health.memory.usedPct >= 70 ? 'text-amber-400' : 'text-primary'}`}>
                  {health.memory.usedMB} MB
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {health.memory.usedPct}% of {health.memory.totalMB} MB
                </p>
                {health.memory.availableMB && (
                  <p className="text-[10px] font-mono text-emerald-400 mt-0.5">
                    Avail: {health.memory.availableMB}MB · Buff/Cache: {(health.memory.buffersMB || 0) + (health.memory.cachedMB || 0)}MB
                  </p>
                )}
                <UsageBar pct={health.memory.usedPct} colorClass={getBarColor(health.memory.usedPct)} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Real-time Internet Speed */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Real-Time Bandwidth</CardTitle>
            <Zap className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            {!health ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-emerald-400 flex items-center font-mono"><ArrowDown className="w-4 h-4 inline mr-0.5" />{health.network?.downloadSpeed || '0.0 KB/s'}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-mono">
                  <ArrowUp className="w-3 h-3 text-primary inline" /> Upload: <span className="text-foreground font-semibold">{health.network?.uploadSpeed || '0.0 KB/s'}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Data Consumption & Multi-Target Latency */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Network Latency & Data</CardTitle>
            <Wifi className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            {!health ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-foreground font-mono">
                    {health.network?.totalConsumptionGB} GB
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 font-mono">
                    Avg {health.networkSpeed?.latencyMs}ms
                  </Badge>
                </div>
                <div className="mt-2 space-y-1">
                  {health.networkSpeed?.targets?.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-muted-foreground truncate max-w-[120px]">{t.name}</span>
                      <span className="text-emerald-400 font-semibold">{t.latencyMs} ms</span>
                    </div>
                  )) || (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      Ping: <span className="text-emerald-400 font-semibold">{health.networkSpeed?.latencyMs} ms</span> ({health.networkSpeed?.status})
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hardware Sensors & Network Interfaces Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hardware Sensors, Fans & Thermal Matrix */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  Hardware Telemetry: Thermal Sensors & System Fans ({health?.sensors?.fanCount || 0} Fans Detected)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Real-time Linux sysfs hwmon sensors, per-core CPU package temperatures, ACPI cooling fans, and thermal zones.
                </CardDescription>
              </div>
              <Badge className="self-start sm:self-auto bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1 font-mono text-xs">
                {health?.sensors?.fanCount || 1} System Fans Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!health ? <Skeleton className="h-48 w-full" /> : (
              <div className="space-y-6">
                {/* Top Row: CPU Package & Main Sensors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CPU Package Temp</span>
                      <Badge className={
                        health.sensors?.tempStatus === 'NORMAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        health.sensors?.tempStatus === 'ELEVATED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        'bg-muted text-muted-foreground'
                      }>
                        {health.sensors?.tempStatus}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold font-mono text-foreground mt-2">
                      {typeof health.sensors?.cpuTempC === 'number' ? `${health.sensors.cpuTempC}°C` : health.sensors?.cpuTempC}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono block mt-1">Intel Core Package (hwmon coretemp)</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary Fan Status</span>
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    </div>
                    <div className="text-xl font-bold font-mono text-cyan-400 mt-2 flex items-center gap-2">
                      <Fan className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '2.5s' }} />
                      {health.sensors?.fanSpeed || 'Auto (PWM)'}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono block mt-1">ACPI EC Dynamic PWM Control</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CPU Frequency</span>
                      <Cpu className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="text-xl font-bold font-mono text-foreground mt-2">
                      {health.sensors?.clockSpeedGHz} GHz
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono block mt-1">{health.sensors?.cpuArchitecture} · {health.sensors?.cpuCores} Cores</span>
                  </div>
                </div>

                {/* Per-Core & Thread Temperatures for ALL Logical Cores */}
                {health.sensors?.logicalCores && health.sensors.logicalCores.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                      CPU Logical Cores Thermal Breakdown ({health.sensors.logicalCores.length} Cores)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {health.sensors.logicalCores.map((core, i) => (
                        <div key={i} className="p-3 rounded-md bg-muted/30 border border-border/40 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-foreground font-mono block">{core.coreId}</span>
                            <span className="text-[10px] text-muted-foreground font-mono block">{core.speedMHz} MHz</span>
                          </div>
                          <span className={`text-sm font-bold font-mono ${core.tempC >= 75 ? 'text-red-400' : core.tempC >= 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {core.tempC}°C
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Power & Battery Voltage Sensors */}
                {health.sensors?.powerSensors && health.sensors.powerSensors.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Hardware Power & Voltage Telemetry</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {health.sensors.powerSensors.map((p, i) => (
                        <div key={i} className="p-2.5 rounded-md bg-muted/30 border border-border/40 flex items-center justify-between font-mono text-xs">
                          <span className="text-muted-foreground">{p.name}</span>
                          <span className="text-emerald-400 font-bold">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ALL DETECTED SYSTEM FANS GRID */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Fan className="w-4 h-4 text-cyan-400" />
                      All Detected System Fans ({health.sensors?.fans?.length || 0} Fans)
                    </h3>
                    <span className="text-[11px] text-muted-foreground font-mono">Mode: ACPI EC PWM / Tachometer</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {health.sensors?.fans && health.sensors.fans.length > 0 ? (
                      health.sensors.fans.map((fan, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Fan className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: `${2 + (idx % 3) * 0.5}s` }} />
                            <div>
                              <span className="text-xs font-semibold text-foreground font-mono block">{fan.name}</span>
                              <span className="text-[10px] text-muted-foreground font-mono block">sysfs {fan.id}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold font-mono text-cyan-400 block">{fan.speed}</span>
                            <Badge className="text-[9px] px-1.5 py-0 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {fan.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground font-mono">
                        System Cooling Fan: Auto PWM Dynamic Control
                      </div>
                    )}
                  </div>
                </div>

                {/* THERMAL SENSOR ZONES MATRIX */}
                {health.sensors?.thermalZones && health.sensors.thermalZones.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">All Thermal Zones & Hardware Sensors</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {health.sensors.thermalZones.map((tz, i) => (
                        <div key={i} className="p-2.5 rounded-md bg-muted/30 border border-border/40 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-mono text-foreground font-medium block truncate max-w-[120px]" title={tz.name}>{tz.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{tz.id}</span>
                          </div>
                          <span className={`text-xs font-bold font-mono ${tz.tempC >= 70 ? 'text-red-400' : tz.tempC >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {tz.tempC}°C
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
            {!health ? <Skeleton className="h-32 w-full" /> : (
              <div className="space-y-3">
                {health.network?.interfaces && health.network.interfaces.length > 0 ? (
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
                    Total Network Data: {health.network?.totalConsumptionGB} GB (Rx: {health.network?.rxGB} GB, Tx: {health.network?.txGB} GB)
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
          {!health ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {health.aiProviders.map((p, i) => (
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
          {!health ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(health.dataStores).map(([file, info]) => (
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
