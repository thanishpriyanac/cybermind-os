'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Users, 
  Server, 
  MessageSquare, 
  Key, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  UserPlus, 
  ExternalLink,
  Cpu,
  HardDrive,
  Database,
  Shield,
  Bot,
  Terminal,
  Zap,
  Flame,
  Fan,
  Globe,
  Wifi,
  Smartphone,
  Laptop,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'SOC_ANALYST' | 'READONLY_VIEWER';
  tenantId: string;
  status: 'ACTIVE' | 'SUSPENDED';
  lastLogin: string;
}

const INITIAL_USERS: UserRecord[] = [
  {
    id: 'usr-1',
    name: 'Master Admin',
    email: 'admin@cybermind.local',
    role: 'SUPER_ADMIN',
    tenantId: 'cybermind-master-tenant',
    status: 'ACTIVE',
    lastLogin: 'Active Session',
  },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'CONVERSATIONS' | 'AI_PROVIDERS'>('OVERVIEW');
  const [users] = useState<UserRecord[]>(INITIAL_USERS);
  const [toast, setToast] = useState<string | null>(null);
  const [streamData, setStreamData] = useState<any | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Instant SSE Stream Connection (Zero-Delay Streaming without needing manual refresh)
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
      es.onerror = () => setIsStreaming(false);
    } catch {
      setIsStreaming(false);
    }

    return () => {
      if (es) es.close();
    };
  }, []);

  // Rapid 500ms Polling Fallback if SSE stream is disconnected
  const { data: fallbackHealth, isLoading: healthLoading, refetch: refetchHealth, isRefetching } = useQuery({
    queryKey: ['admin-system-health-real'],
    queryFn: async () => {
      const res = await api.get('/v1/health');
      return res.data;
    },
    enabled: !isStreaming || !streamData,
    refetchInterval: 500,
    staleTime: 200,
  });

  // Live AI Usage Metrics (rapid auto-update)
  const { data: aiUsage } = useQuery({
    queryKey: ['admin-ai-usage'],
    queryFn: async () => {
      const res = await fetch('/api/v1/ai/usage');
      return res.json();
    },
    refetchInterval: 2000,
  });

  // Real Copilot Conversations for Audit
  const { data: conversations = [] } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: async () => {
      const res = await fetch('/api/v1/ai/conversations');
      return res.json();
    },
    refetchInterval: 3000,
  });

  // Live Active User Sessions with IP, Device, Network & Geo Location Telemetry
  const { data: userSessionsData } = useQuery({
    queryKey: ['admin-user-sessions'],
    queryFn: async () => {
      const res = await fetch('/api/v1/identity/users');
      return res.json();
    },
    refetchInterval: 2000,
  });

  const health = streamData || fallbackHealth;

  return (
    <div className="space-y-6 p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-black font-semibold px-4 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-5">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary animate-pulse" />
            Platform Administration & Control Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Zero-delay real-time server governance, process telemetry, and AI model health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {isStreaming ? 'Live Stream (0ms)' : 'Real-Time SSE'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetchHealth()} disabled={isRefetching} className="gap-1 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs py-1.5 px-3 font-mono">
            Tenant: cybermind-master-tenant
          </Badge>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'OVERVIEW'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Activity className="w-4 h-4" /> System Overview
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'USERS'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" /> Users & Access
        </button>

        <button
          onClick={() => setActiveTab('CONVERSATIONS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'CONVERSATIONS'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Global Chat Audit
        </button>

        <button
          onClick={() => setActiveTab('AI_PROVIDERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'AI_PROVIDERS'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Key className="w-4 h-4" /> AI Models & Status
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Key Platform Stats (REAL OS DATA) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                  Server CPU Load
                  <Cpu className="w-3.5 h-3.5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthLoading ? <Skeleton className="h-8 w-20" /> : (
                  <>
                    <div className="text-2xl font-bold text-foreground">{health?.cpu?.usagePct ?? 0}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {health?.server?.cpuCount ?? 1} Cores • Load avg: {health?.server?.loadAvg?.[0] ?? '0.00'}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                  RAM Usage
                  <Activity className="w-3.5 h-3.5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthLoading ? <Skeleton className="h-8 w-20" /> : (
                  <>
                    <div className="text-2xl font-bold text-foreground">{health?.memory?.usedPct ?? 0}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(health?.memory?.usedMB / 1024).toFixed(1)} GB / {(health?.memory?.totalMB / 1024).toFixed(1)} GB
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                  Disk Storage (/)
                  <HardDrive className="w-3.5 h-3.5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthLoading ? <Skeleton className="h-8 w-20" /> : (
                  <>
                    <div className="text-2xl font-bold text-foreground">{health?.disk?.usedPct ?? 0}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {health?.disk?.usedGB ?? '0'} GB / {health?.disk?.totalGB ?? '0'} GB
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                  AI Activity (24h)
                  <Zap className="w-3.5 h-3.5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiLoading ? <Skeleton className="h-8 w-20" /> : (
                  <>
                    <div className="text-2xl font-bold text-emerald-400">{aiUsage?.last24h ?? 0} Sessions</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(aiUsage?.totalTokens ?? 0).toLocaleString()} tokens processed
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Node Process Governance & File Storage */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" /> Node.js Host Process Governance
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Live runtime metrics for the active CyberMind application instance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {healthLoading ? <Skeleton className="h-32 w-full" /> : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/60">
                      <div className="flex items-center gap-3">
                        <Server className="w-4 h-4 text-primary" />
                        <div>
                          <span className="font-semibold text-sm text-foreground">cybermind-console</span>
                          <span className="text-xs text-muted-foreground block font-mono">
                            PID #{health?.nodeProcess?.pid} • Node {health?.nodeProcess?.nodeVersion}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="font-mono text-muted-foreground">Heap: {health?.nodeProcess?.heapUsedMB} MB / {health?.nodeProcess?.heapTotalMB} MB</span>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ONLINE
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/60">
                      <div className="flex items-center gap-3">
                        <Cpu className="w-4 h-4 text-primary" />
                        <div>
                          <span className="font-semibold text-sm text-foreground">Server Host Node</span>
                          <span className="text-xs text-muted-foreground block font-mono">
                            {health?.server?.hostname} • {health?.server?.platform} ({health?.server?.arch})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="font-mono text-muted-foreground">Uptime: {health?.server?.uptime}</span>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          HEALTHY
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Store Storage */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" /> System Data Stores
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Persistent JSON database stores in root `data/`.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {healthLoading ? <Skeleton className="h-32 w-full" /> : (
                  <div className="space-y-2">
                    {Object.entries(health?.dataStores || {}).map(([file, info]: [string, any]) => (
                      <div key={file} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30 border border-border/40">
                        <span className="font-mono font-medium">{file}</span>
                        <div className="flex items-center gap-2">
                          {info.exists ? (
                            <span className="text-muted-foreground font-mono">{info.sizeKB} KB ({info.records} items)</span>
                          ) : (
                            <span className="text-amber-400">Empty</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: USERS & ACCESS LOGINS */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Active User Sessions & Login Telemetry
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time active analyst sessions, client IP addresses, internet network connection types, device models & geographic locations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 font-mono text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {userSessionsData?.activeUsersCount || 2} Active Users Online
              </Badge>
              <Button size="sm" onClick={() => showToast('User invite link copied to clipboard')} className="bg-primary gap-1.5 text-xs">
                <UserPlus className="w-3.5 h-3.5" /> Invite Analyst
              </Button>
            </div>
          </div>

          {/* User Sessions Telemetry List */}
          <div className="grid grid-cols-1 gap-4">
            {(userSessionsData?.sessions || []).map((sess: any, idx: number) => (
              <Card key={idx} className="bg-card border-border hover:border-primary/50 transition-all">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* User Profile & Role */}
                    <div className="flex items-start gap-3 min-w-[220px]">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                        {sess.name ? sess.name.substring(0, 2).toUpperCase() : 'US'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{sess.name || sess.email}</span>
                          <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono px-2 py-0">
                            {sess.role}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono block mt-0.5">{sess.email}</span>
                        <span className="text-[10px] text-muted-foreground font-mono block">Tenant: {sess.tenantId}</span>
                      </div>
                    </div>

                    {/* Telemetry Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono bg-muted/30 p-3 rounded-lg border border-border/50 flex-1">
                      {/* IP & Location */}
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-sans font-semibold flex items-center gap-1">
                          <Globe className="w-3 h-3 text-primary" /> IP & Geo Location
                        </span>
                        <span className="text-foreground font-bold block mt-0.5">{sess.ipAddress}</span>
                        <span className="text-emerald-400 text-[11px] block flex items-center gap-1 mt-0.5 truncate max-w-[170px]" title={sess.location}>
                          <MapPin className="w-2.5 h-2.5 inline" /> {sess.location}
                        </span>
                      </div>

                      {/* Device & OS */}
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-sans font-semibold flex items-center gap-1">
                          <Laptop className="w-3 h-3 text-cyan-400" /> Device & OS
                        </span>
                        <span className="text-foreground font-semibold block mt-0.5">{sess.deviceType || 'Desktop PC'}</span>
                        <span className="text-muted-foreground text-[11px] block mt-0.5">{sess.os} · {sess.browser}</span>
                      </div>

                      {/* Network Connection */}
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-sans font-semibold flex items-center gap-1">
                          <Wifi className="w-3 h-3 text-emerald-400" /> Internet Network
                        </span>
                        <span className="text-emerald-400 font-semibold block mt-0.5">{sess.networkType || 'Wi-Fi Broadband'}</span>
                        <span className="text-muted-foreground text-[11px] block mt-0.5">Active Session</span>
                      </div>
                    </div>

                    {/* Status & Last Active */}
                    <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center text-xs font-mono min-w-[130px]">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1">
                        ● {sess.status || 'ACTIVE_NOW'}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground mt-1">
                        Active {new Date(sess.lastActiveAt || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CONVERSATIONS AUDIT */}
      {activeTab === 'CONVERSATIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Global CyberAI Audit Log</h2>
              <p className="text-xs text-muted-foreground">Active session telemetry and prompt history.</p>
            </div>
            <Link href="/copilot">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                Open CyberAI Console <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Active AI Sessions</span>
                <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{aiUsage?.last24h ?? conversations.length ?? 0}</div>
                <span className="text-[11px] text-muted-foreground font-mono">Real-time sessions</span>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Tokens Processed</span>
                <div className="text-2xl font-bold text-primary font-mono mt-1">{(aiUsage?.totalTokens ?? 0).toLocaleString()}</div>
                <span className="text-[11px] text-muted-foreground font-mono">Tokens in last 24h</span>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">AI Routing Engine</span>
                <div className="text-xl font-bold text-foreground font-mono mt-1">Auto Router</div>
                <span className="text-[11px] text-emerald-400 font-mono">Groq / NVIDIA / xAI</span>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Saved AI Security Analysis Sessions ({conversations.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No active AI chat sessions recorded yet. Start a session in CyberAI Console.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {conversations.map((c: any) => (
                    <div key={c.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground font-mono">{c.title || 'Security Analysis'}</span>
                          <Badge variant="outline" className="text-[10px] font-mono">{c.model}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono block mt-0.5">
                          ID: {c.id} • {c.messageCount || 0} messages • User: {c.userId || 'admin@cybermind.local'}
                        </span>
                      </div>
                      <div className="text-right text-xs font-mono text-muted-foreground">
                        <span>{new Date(c.updatedAt || c.lastMessageAt || Date.now()).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: AI MODELS */}
      {activeTab === 'AI_PROVIDERS' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">AI Gateway & Live Provider Pings</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(health?.aiProviders || []).map((p: any, idx: number) => (
              <Card key={idx} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{p.name}</CardTitle>
                    <Badge className={
                      p.status === 'operational' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      p.status === 'not_configured' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }>
                      {p.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Latency:</span>
                    <span className="text-emerald-400 font-mono font-medium">{p.latencyMs ? `${p.latencyMs}ms` : 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
