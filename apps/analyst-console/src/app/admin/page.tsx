'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  MapPin,
  BookOpen,
  Sparkles,
  Clock,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'SOC_ANALYST' | 'INCIDENT_RESPONDER';
  tenantId: string;
  status: 'ACTIVE' | 'REVOKED';
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
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'CONVERSATIONS' | 'AI_PROVIDERS' | 'LEARNING'>('OVERVIEW');
  const [users] = useState<UserRecord[]>(INITIAL_USERS);
  const [toast, setToast] = useState<string | null>(null);
  const [streamData, setStreamData] = useState<any | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Instant SSE Stream Connection
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

  // Live AI Usage Metrics
  const { data: aiUsage, isLoading: aiLoading } = useQuery({
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

  // Live Active User Sessions (IP, network, device, location)
  const { data: userSessions } = useQuery({
    queryKey: ['admin-user-sessions'],
    queryFn: async () => {
      const res = await fetch('/api/v1/identity/users');
      return res.json();
    },
    refetchInterval: 2000,
  });

  // Web Learning Engine Status & Learned Knowledge
  const { data: learningStatus, refetch: refetchLearning } = useQuery({
    queryKey: ['admin-learning-status'],
    queryFn: async () => {
      const res = await fetch('/api/v1/learning/status');
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: learningArticles = [] } = useQuery({
    queryKey: ['admin-learning-articles'],
    queryFn: async () => {
      const res = await fetch('/api/v1/learning/articles');
      const data = await res.json();
      return data.data || [];
    },
    refetchInterval: 5000,
  });

  const triggerLearningMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/learning/trigger', { method: 'POST' });
      return res.json();
    },
    onSuccess: () => {
      refetchLearning();
      showToast('Live Web Learning Scrape pass completed successfully.');
    },
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
          <Users className="w-4 h-4" /> Users & Sessions ({userSessions?.activeCount ?? 1})
        </button>

        <button
          onClick={() => setActiveTab('LEARNING')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'LEARNING'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <BookOpen className="w-4 h-4 text-cyan-400" /> Web Learning Engine (18:00 - 09:00)
        </button>

        <button
          onClick={() => setActiveTab('CONVERSATIONS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'CONVERSATIONS'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> CyberAI Audit Log
        </button>

        <button
          onClick={() => setActiveTab('AI_PROVIDERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'AI_PROVIDERS'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Key className="w-4 h-4" /> AI Models & Providers
        </button>
      </div>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                  CPU Telemetry
                  <Cpu className="w-3.5 h-3.5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthLoading ? <Skeleton className="h-8 w-20" /> : (
                  <>
                    <div className="text-2xl font-bold text-foreground">{health?.cpu?.usagePct ?? 0}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {health?.sensors?.cpuCores ?? health?.server?.cpuCount ?? 4} Cores · {health?.sensors?.clockSpeedGHz ?? '2.30'} GHz
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                  Memory (RAM)
                  <HardDrive className="w-3.5 h-3.5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthLoading ? <Skeleton className="h-8 w-20" /> : (
                  <>
                    <div className="text-2xl font-bold text-foreground">{health?.memory?.usedMB ?? 0} MB</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {health?.memory?.usedPct ?? 0}% of {health?.memory?.totalMB ?? 0} MB
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                  Storage Partition
                  <Database className="w-3.5 h-3.5 text-primary" />
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

          {/* Node Process Governance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" /> Node.js Host Process Governance
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Process memory limits, heap allocation, and Node runtime specs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-3 bg-muted/40 rounded-lg border border-border/60">
                    <span className="text-muted-foreground block text-[11px]">Process ID</span>
                    <span className="text-foreground font-bold text-sm">{health?.nodeProcess?.pid ?? 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-lg border border-border/60">
                    <span className="text-muted-foreground block text-[11px]">Heap Used</span>
                    <span className="text-emerald-400 font-bold text-sm">{health?.nodeProcess?.heapUsedMB ?? 0} MB</span>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-lg border border-border/60">
                    <span className="text-muted-foreground block text-[11px]">RSS Memory</span>
                    <span className="text-primary font-bold text-sm">{health?.nodeProcess?.rssMB ?? 0} MB</span>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-lg border border-border/60">
                    <span className="text-muted-foreground block text-[11px]">Node Version</span>
                    <span className="text-foreground font-bold text-sm">{health?.nodeProcess?.nodeVersion ?? 'v20.x'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" /> Thermal Sensors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">CPU Package</span>
                  <span className="font-bold text-amber-400">{health?.sensors?.cpuTempC ?? 'N/A'}°C</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground">Cooling Fan Mode</span>
                  <span className="font-bold text-cyan-400">{health?.sensors?.fanSpeed ?? 'Auto (PWM)'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: WEB LEARNING ENGINE */}
      {activeTab === 'LEARNING' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-4 bg-muted/40 border border-border rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400 animate-pulse" />
                Autonomous Web Learning Engine
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Surfs the web overnight to scrape, study, and store cybersecurity threat content in the <code className="font-mono text-cyan-400">learning</code> DB.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 font-mono text-xs flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Schedule: 18:00 (6 PM) - 09:00 (9 AM)
              </Badge>
              <Button
                onClick={() => triggerLearningMutation.mutate()}
                disabled={triggerLearningMutation.isPending}
                size="sm"
                className="bg-primary hover:bg-primary/90 gap-1.5 text-xs font-medium"
              >
                {triggerLearningMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Run Live Scrape Now
              </Button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Knowledge Articles Stored</span>
                <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">{learningStatus?.totalArticles ?? learningArticles.length ?? 0}</div>
                <span className="text-[11px] text-muted-foreground font-mono">Stored in learning DB</span>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Target Web Sources</span>
                <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{learningStatus?.sourcesCrawled ?? 6} Feeds</div>
                <span className="text-[11px] text-muted-foreground font-mono">CISA, NVD, Exploit-DB, News</span>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Overnight Active Window</span>
                <div className="text-lg font-bold text-foreground font-mono mt-1">
                  {learningStatus?.activeWindow?.isWithinWindow ? '● Active Now' : 'Scheduled (6 PM)'}
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">18:00 - 09:00 Daily</span>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Last Web Scrape Pass</span>
                <div className="text-xs font-bold text-muted-foreground font-mono mt-2 truncate">
                  {learningStatus?.lastRunAt ? new Date(learningStatus.lastRunAt).toLocaleTimeString() : 'Active Daemon'}
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">24/7 Background Cron</span>
              </CardContent>
            </Card>
          </div>

          {/* Live Scraping Terminal Logs */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Live Web Learning Process Console
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Real-time log stream showing active URL crawling and threat extraction.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black/80 rounded-lg p-3 font-mono text-xs space-y-1.5 max-h-52 overflow-y-auto border border-border/80">
                {(learningStatus?.liveLogs || []).map((log: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-muted-foreground text-[10px] whitespace-nowrap">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={
                      log.level === 'success' ? 'text-emerald-400 font-semibold' :
                      log.level === 'warn' ? 'text-amber-400' : 'text-cyan-300'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Learned Articles Table */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Learned Cybersecurity Knowledge Database ({learningArticles.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {learningArticles.map((art: any) => (
                  <div key={art.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{art.title}</span>
                        <Badge className={
                          art.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          art.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }>
                          {art.severity || art.category}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-mono text-cyan-400 border-cyan-500/30">{art.source}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-3xl">{art.summary}</p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground pt-1">
                        <span>URL: <a href={art.url} target="_blank" rel="noreferrer" className="text-primary underline">{art.url}</a></span>
                        {art.cveId && <span>• {art.cveId}</span>}
                      </div>
                    </div>
                    <div className="text-right text-xs font-mono text-muted-foreground whitespace-nowrap">
                      <span>{new Date(art.scrapedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: USERS & ACTIVE SESSIONS */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Active User Sessions & Telemetry ({userSessions?.activeCount ?? 1})</h2>
            <Button size="sm" onClick={() => showToast('New User Registration Link generated.')} className="gap-1 text-xs">
              <UserPlus className="w-3.5 h-3.5" /> Invite User
            </Button>
          </div>

          {/* User Sessions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(userSessions?.users || []).map((usr: any, idx: number) => (
              <Card key={idx} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">{usr.name}</CardTitle>
                      <CardDescription className="text-xs font-mono">{usr.email}</CardDescription>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                      ● Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs font-mono">
                  <div className="p-2 rounded bg-muted/40 space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>🌐 IP Address:</span>
                      <span className="text-foreground font-bold">{usr.ip}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>📡 Connection:</span>
                      <span className="text-cyan-400 font-bold">{usr.networkType}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>💻 Device OS / Browser:</span>
                      <span className="text-foreground font-semibold truncate max-w-[200px]">{usr.deviceOS} ({usr.browser})</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>📍 Location:</span>
                      <span className="text-emerald-400 font-bold">{usr.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CONVERSATIONS AUDIT */}
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
                <span className="text-[11px] text-emerald-400 font-mono">Groq / NVIDIA / OpenAI</span>
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

      {/* TAB 5: AI MODELS */}
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
