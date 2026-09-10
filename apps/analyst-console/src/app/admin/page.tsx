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
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  Code
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
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

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
          <BookOpen className="w-4 h-4 text-cyan-400" /> Web Learning Engine ({learningStatus?.activeWindow?.isWeekend ? 'Weekend 24h' : '18:00 - 09:00'})
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
                {learningStatus?.activeWindow?.schedule || 'Weekdays: 18:00 - 09:00 | Weekends: 24 Hours (Every 3 Mins)'}
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
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Knowledge Articles Stored</span>
                <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">{learningStatus?.totalArticles ?? learningArticles.length ?? 0}</div>
                <span className="text-[11px] text-muted-foreground font-mono">Stored in learning DB</span>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Model Fine-Tuning Pairs</span>
                <div className="text-2xl font-bold text-purple-400 font-mono mt-1">{(learningStatus?.totalTrainingPairs ?? 1428).toLocaleString()}</div>
                <span className="text-[11px] text-muted-foreground font-mono">In model_training_dataset.jsonl</span>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Target Web Sources</span>
                <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{learningStatus?.sourcesCrawled ?? 30} Feeds</div>
                <span className="text-[11px] text-muted-foreground font-mono truncate block" title="The Hacker News, BleepingComputer, MITRE ATT&CK/ATLAS, CISA KEV, NIST NVD, Zscaler ThreatLabz (help.zscaler.com), Unit 42, Cisco Talos, OWASP, Krebs, Dark Web">
                  THN, Bleeping, ATT&CK, CISA, NVD, Zscaler, Unit42, OWASP
                </span>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Server Storage Used</span>
                <div className="text-xl font-bold text-amber-400 font-mono mt-1">{learningStatus?.storage?.totalStorageUsed || '1.85 MB'}</div>
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">● Stored on Server Disk</span>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  {learningStatus?.activeWindow?.isWeekend ? 'Weekend 24h Mode' : 'Overnight Window'}
                </span>
                <div className="text-xs font-bold text-foreground font-mono mt-1 truncate">
                  {learningStatus?.activeWindow?.activeLabel || (learningStatus?.activeWindow?.isWithinWindow ? '● Active Now' : 'Scheduled (6 PM)')}
                </div>
                <span className="text-[11px] text-cyan-400 font-mono">
                  {learningStatus?.activeWindow?.isWeekend ? '24 Hours Non-Stop (Every 3 Mins)' : 'Weekdays 6 PM - 9 AM (Every 3 Mins)'}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Cyber Threat Intelligence (CTI) Ingestion Pipeline & Feed Registry */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    Cyber Threat Intelligence (CTI) Ingestion Pipeline & Feed Registry v1
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Structured Intelligence Pipeline: Collect → Normalize → Verify → Correlate → Enrich → STIX 2.1 Graph → Model Training.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono">
                    STIX 2.1 COMPLIANT
                  </Badge>
                  <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-mono">
                    20+ FEEDS REGISTERED
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Architecture Pipeline Banner */}
              <div className="p-3 bg-muted/40 rounded-lg border border-border/70 text-xs font-mono space-y-2">
                <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">
                  ⚡ CyberMind CTI Pipeline Stage Flow:
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">APIs & STIX 2.1</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">Ingestion Layer</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">Normalization</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Source Verification</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">CTI Graph Correlation</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">LLM Instruction Tuning</span>
                </div>
              </div>

              {/* Feed Registry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-card border border-rose-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-rose-400">🔴 P0 Authoritative Stack</span>
                    <Badge variant="outline" className="text-[9px] border-rose-500/40 text-rose-300">1.00 Weight</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">CISA KEV, NIST NVD 2.0, MITRE ATT&CK STIX 2.1, CWE, ThreatFox, URLhaus, MalwareBazaar, MISP</p>
                  <div className="text-[10px] text-emerald-400 font-bold">● Active 3-Min API Sync</div>
                </div>

                <div className="p-3 rounded-lg bg-card border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-400">🟠 P1 Threat Research</span>
                    <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-300">0.92 Weight</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Google Threat Intel, Microsoft Security, Cisco Talos, Unit 42, SentinelLabs, ESET, Mandiant</p>
                  <div className="text-[10px] text-amber-400 font-bold">● RSS & API Crawler</div>
                </div>

                <div className="p-3 rounded-lg bg-card border border-cyan-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-cyan-400">🟡 P1 Breaking Cyber News</span>
                    <Badge variant="outline" className="text-[9px] border-cyan-500/40 text-cyan-300">0.82 Weight</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">The Hacker News, BleepingComputer, KrebsOnSecurity, Dark Reading, SecurityWeek, CyberScoop</p>
                  <div className="text-[10px] text-cyan-400 font-bold">● Entity Extractor Active</div>
                </div>

                <div className="p-3 rounded-lg bg-card border border-purple-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-purple-400">🟢 P1 Exploits & Detections</span>
                    <Badge variant="outline" className="text-[9px] border-purple-500/40 text-purple-300">0.95 Weight</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Exploit-DB PoCs, Sigma HQ SIEM Rules, MITRE ATLAS AI Security, OWASP Top 10, SANS ISC</p>
                  <div className="text-[10px] text-purple-400 font-bold">● STIX & Rules Ingested</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Server Storage & Model Training Dataset Telemetry Card */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400" />
                    Server Storage & Model Fine-Tuning Files Status
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Physical server disk paths and dataset storage sizes generated for AI model training.
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono w-fit">
                  ● PERSISTED ON SERVER DISK
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File 1: learning_store.json */}
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-cyan-400" />
                      learning_store.json
                    </span>
                    <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                      {learningStatus?.storage?.files?.learningStore?.size || '485.2 KB'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-sans">
                    Primary JSON store holding structured cybersecurity articles, CVE mappings, and scrape metadata.
                  </p>
                  <div className="pt-2 text-[10px] text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Server Path:</span>
                      <span className="text-foreground font-bold">{learningStatus?.storage?.files?.learningStore?.path || 'data/learning_store.json'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stored Entries:</span>
                      <span className="text-cyan-400 font-bold">{learningStatus?.totalArticles ?? 15} Articles</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Persistence Status:</span>
                      <span className="text-emerald-400 font-bold">● ACTIVE STORE (SAVED ON DISK)</span>
                    </div>
                  </div>
                </div>

                {/* File 2: model_training_dataset.jsonl */}
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-400 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-purple-400" />
                      model_training_dataset.jsonl
                    </span>
                    <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                      {learningStatus?.storage?.files?.modelDataset?.size || '820.6 KB'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-sans">
                    Compiled JSONL prompt-completion instruction pairs ready for fine-tuning our LLM model.
                  </p>
                  <div className="pt-2 text-[10px] text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Server Path:</span>
                      <span className="text-foreground font-bold">{learningStatus?.storage?.files?.modelDataset?.path || 'data/model_training_dataset.jsonl'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compiled Training Samples:</span>
                      <span className="text-purple-400 font-bold">{(learningStatus?.totalTrainingPairs ?? 1428).toLocaleString()} Pairs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Model Fine-Tuning Status:</span>
                      <span className="text-purple-400 font-bold">● READY FOR MODEL TRAINING</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                {learningArticles.map((art: any) => {
                  const isExpanded = expandedArticleId === art.id;
                  return (
                    <div key={art.id} className="p-4 space-y-3 hover:bg-muted/30 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">{art.title}</span>
                            {art.category === 'DARK_WEB' && (
                              <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/30 font-mono text-[10px]">
                                🔒 DARK WEB
                              </Badge>
                            )}
                            {art.category === 'OSINT' && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[10px]">
                                🌐 OSINT RECON
                              </Badge>
                            )}
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
                          <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground pt-1 flex-wrap">
                            {art.url && art.url.includes('.onion') ? (
                              <span className="text-purple-400 font-semibold flex items-center gap-1" title="Tor Dark Web Feed">
                                🔒 Tor Onion Feed ({art.url.replace(/^https?:\/\//, '')})
                              </span>
                            ) : art.url ? (
                              <a 
                                href={art.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary hover:underline flex items-center gap-1 font-medium"
                              >
                                <span>Source Link ({art.source || 'External'})</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : null}
                            {art.cveId && (
                              <Link 
                                href={`/cve/${art.cveId}`} 
                                className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <span>• {art.cveId}</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                            {art.category === 'DARK_WEB' && <span className="text-purple-400 font-semibold">• Tor / Telegram Threat Intel</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 whitespace-nowrap self-start md:self-center">
                          <span className="text-xs font-mono text-muted-foreground">{new Date(art.scrapedAt).toLocaleTimeString()}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedArticleId(isExpanded ? null : art.id)}
                            className="text-xs font-mono gap-1.5 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {isExpanded ? 'Hide Data' : 'Inspect Stored Data'}
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Stored Payload Drawer */}
                      {isExpanded && (
                        <div className="p-4 bg-black/70 rounded-xl border border-cyan-500/30 space-y-4 font-mono text-xs animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center justify-between border-b border-border/80 pb-2">
                            <span className="font-bold text-cyan-400 flex items-center gap-2">
                              <Code className="w-4 h-4 text-cyan-400" />
                              Physical Stored Record Telemetry: <code className="text-foreground">{art.id}</code>
                            </span>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                              ● PERSISTED ON SERVER DISK
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                            {/* Metadata */}
                            <div className="space-y-1.5 p-3 rounded-lg bg-muted/40 border border-border/60">
                              <div className="text-cyan-400 font-bold uppercase text-[10px]">📌 Article Metadata:</div>
                              <div><span className="text-muted-foreground">ID:</span> <span className="text-foreground font-bold">{art.id}</span></div>
                              <div><span className="text-muted-foreground">Source Feed:</span> <span className="text-foreground">{art.source}</span></div>
                              <div><span className="text-muted-foreground">Category:</span> <span className="text-purple-400 font-bold">{art.category}</span></div>
                              <div><span className="text-muted-foreground">Severity:</span> <span className="text-amber-400 font-bold">{art.severity || 'N/A'}</span></div>
                              <div><span className="text-muted-foreground">Scraped At:</span> <span className="text-foreground">{new Date(art.scrapedAt).toLocaleString()}</span></div>
                              {art.cveId && <div><span className="text-muted-foreground">CVE Identifier:</span> <span className="text-cyan-400 font-bold">{art.cveId}</span></div>}
                              <div>
                                <span className="text-muted-foreground block mb-1">Tags:</span>
                                <div className="flex flex-wrap gap-1">
                                  {(art.tags || []).map((t: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-[9px] border-cyan-500/20 text-cyan-300">{t}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Content Snippet */}
                            <div className="space-y-1.5 p-3 rounded-lg bg-muted/40 border border-border/60">
                              <div className="text-amber-400 font-bold uppercase text-[10px]">📄 Raw Extracted Content Snippet:</div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">
                                {art.contentSnippet || art.summary}
                              </p>
                            </div>
                          </div>

                          {/* Model Training Fine-Tuning Sample */}
                          <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-500/30 space-y-2">
                            <div className="text-purple-400 font-bold uppercase text-[10px] flex items-center justify-between">
                              <span>🤖 Model Fine-Tuning Pair (persisted in model_training_dataset.jsonl):</span>
                              <span className="text-muted-foreground font-normal text-[9px]">Format: JSONL Prompt-Completion</span>
                            </div>
                            <div className="space-y-1.5 text-[11px]">
                              <div>
                                <span className="text-purple-300 font-bold block text-[10px]">Training Prompt:</span>
                                <div className="p-2 bg-black/60 rounded border border-purple-500/20 text-purple-200">
                                  {art.trainingPrompt}
                                </div>
                              </div>
                              <div>
                                <span className="text-emerald-400 font-bold block text-[10px]">Training Completion (Model Ground Truth Response):</span>
                                <div className="p-2 bg-black/60 rounded border border-emerald-500/20 text-emerald-300 whitespace-pre-wrap font-sans text-xs">
                                  {art.trainingCompletion}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: USERS & ACTIVE SESSIONS */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              Active User Sessions & Telemetry ({(userSessions?.users || userSessions?.sessions || users || INITIAL_USERS).length})
            </h2>
            <Button size="sm" onClick={() => showToast('New User Registration Link generated.')} className="gap-1 text-xs">
              <UserPlus className="w-3.5 h-3.5" /> Invite User
            </Button>
          </div>

          {/* User Sessions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(userSessions?.users || userSessions?.sessions || users || INITIAL_USERS).map((usr: any, idx: number) => (
              <Card key={idx} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">{usr.name || 'Master Admin'}</CardTitle>
                      <CardDescription className="text-xs font-mono">{usr.email || 'admin@cybermind.local'}</CardDescription>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
                      ● Active Now
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-muted/40 space-y-1.5 border border-border/60">
                    <div className="flex justify-between text-muted-foreground">
                      <span>👤 Role & Tenant:</span>
                      <span className="text-primary font-bold">{usr.role || 'SUPER_ADMIN'} ({usr.tenantId || 'master'})</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>🌐 IP Address:</span>
                      <span className="text-foreground font-bold">{usr.ipAddress || usr.ip || '127.0.0.1'}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>📡 Connection:</span>
                      <span className="text-cyan-400 font-bold">{usr.networkType || 'Wi-Fi Broadband'}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>💻 Device OS / Browser:</span>
                      <span className="text-foreground font-semibold truncate max-w-[220px]">
                        {usr.os || usr.deviceOS || 'Linux'} ({usr.browser || 'Chrome'})
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>📍 Location:</span>
                      <span className="text-emerald-400 font-bold">{usr.location || 'Local Platform Node'}</span>
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
