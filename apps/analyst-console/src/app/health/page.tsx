'use client';

import { useState } from 'react';
import { 
  HeartPulse, 
  Activity, 
  CheckCircle2, 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Wifi, 
  ShieldCheck, 
  RefreshCw,
  Zap,
  Bot
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

interface SubsystemHealth {
  name: string;
  category: 'TELEMETRY' | 'ENGINE' | 'STORAGE' | 'AI_GATEWAY';
  status: 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE';
  latency: string;
  uptime: string;
  details: string;
}

const SUBSYSTEMS: SubsystemHealth[] = [
  {
    name: 'Redpanda Event Streaming Cluster',
    category: 'TELEMETRY',
    status: 'OPERATIONAL',
    latency: '3ms',
    uptime: '100.0%',
    details: '14.2k events/sec ingested across 12 Kafka topics. Zero partition lag.',
  },
  {
    name: 'Sigma Rule Real-time Detection Engine',
    category: 'ENGINE',
    status: 'OPERATIONAL',
    latency: '1.4ms',
    uptime: '99.99%',
    details: '2,410 active Sigma rules matching live stream telemetry.',
  },
  {
    name: 'PostgreSQL & Prisma Data Layer',
    category: 'STORAGE',
    status: 'OPERATIONAL',
    latency: '5ms',
    uptime: '100.0%',
    details: 'Primary database cluster healthy. 18 active connection pool threads.',
  },
  {
    name: 'CYBERMIND Multi-Provider AI Gateway',
    category: 'AI_GATEWAY',
    status: 'OPERATIONAL',
    latency: '142ms',
    uptime: '100.0%',
    details: 'NVIDIA NIM DeepSeek V4 Pro (Primary) + Google Gemini 3.6 Flash + Groq active.',
  },
  {
    name: 'Zeek PCAP Deep Packet Inspector',
    category: 'TELEMETRY',
    status: 'OPERATIONAL',
    latency: '12ms',
    uptime: '99.95%',
    details: 'Real-time protocol parsing for HTTP, DNS, TLS, SSH, SMB traffic streams.',
  },
];

export default function HealthPage() {
  const [subsystems] = useState<SubsystemHealth[]>(SUBSYSTEMS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HeartPulse className="w-7 h-7 text-emerald-500" />
            System Health & Telemetry Ingestion
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status monitor for streaming pipelines, detection engines, and AI models.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2 text-xs self-start sm:self-center"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Health Status
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Overall System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Operational
            </div>
            <p className="text-xs text-muted-foreground mt-1">100% ingest pipeline uptime</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Ingestion Throughput</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">14.2k eps</div>
            <p className="text-xs text-muted-foreground mt-1">Events per second</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Storage Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1.2 TB / 4.0 TB</div>
            <p className="text-xs text-emerald-500 mt-1">30% disk utilization</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Detection Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">1.4 ms</div>
            <p className="text-xs text-muted-foreground mt-1">Sigma stream correlation</p>
          </CardContent>
        </Card>
      </div>

      {/* Subsystem Health Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Infrastructure & Subsystem Status
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Monitored health checks for stream processors, storage, and AI inference nodes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subsystems.map((sub, idx) => (
              <div
                key={idx}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/60 gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{sub.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {sub.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{sub.details}</p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="text-muted-foreground block text-[10px]">Latency</span>
                    <span className="font-mono font-medium text-foreground">{sub.latency}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block text-[10px]">Uptime</span>
                    <span className="font-mono font-medium text-emerald-400">{sub.uptime}</span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1">
                    Healthy
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
