'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Users, 
  Server, 
  MessageSquare, 
  Key, 
  Settings, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  UserPlus, 
  ExternalLink,
  Cpu,
  HardDrive,
  Database,
  Lock,
  Search,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

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
    lastLogin: 'Just now',
  },
  {
    id: 'usr-2',
    name: 'Alex Smith (SOC Lead)',
    email: 'analyst.smith@cybermind.local',
    role: 'SOC_ANALYST',
    tenantId: 'cybermind-master-tenant',
    status: 'ACTIVE',
    lastLogin: '2 hours ago',
  },
  {
    id: 'usr-3',
    name: 'Jane Doe (Compliance)',
    email: 'viewer.doe@cybermind.local',
    role: 'READONLY_VIEWER',
    tenantId: 'cybermind-master-tenant',
    status: 'ACTIVE',
    lastLogin: 'Yesterday',
  },
];

interface ProviderStatus {
  name: string;
  model: string;
  keyConfigured: boolean;
  status: 'ACTIVE' | 'BACKUP' | 'OFFLINE';
  latency: string;
  style: string;
}

const INITIAL_PROVIDERS: ProviderStatus[] = [
  {
    name: 'Google Gemini 3.6 Flash',
    model: 'gemini-3.6-flash',
    keyConfigured: true,
    status: 'ACTIVE',
    latency: '340ms',
    style: 'Primary Stream Engine',
  },
  {
    name: 'Groq (GPT-OSS 120B)',
    model: 'openai/gpt-oss-120b',
    keyConfigured: true,
    status: 'ACTIVE',
    latency: '110ms',
    style: 'Fast Sub-second Engine',
  },
  {
    name: 'NVIDIA NIM (DeepSeek V4 Pro)',
    model: 'deepseek-ai/deepseek-v4-pro-0813',
    keyConfigured: true,
    status: 'ACTIVE',
    latency: '820ms',
    style: 'Deep Reasoning Engine',
  },
  {
    name: 'NVIDIA NIM (DeepSeek V4 Flash)',
    model: 'deepseek-ai/deepseek-v4-flash-0731',
    keyConfigured: true,
    status: 'BACKUP',
    latency: '450ms',
    style: 'Backup Engine',
  },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'CONVERSATIONS' | 'AI_PROVIDERS'>('OVERVIEW');
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [providers] = useState<ProviderStatus[]>(INITIAL_PROVIDERS);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

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
            <ShieldCheck className="w-7 h-7 text-primary" />
            Platform Administration & Control Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Global governance, user access management, system health, and AI provider orchestration.
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary border border-primary/20 self-start sm:self-center px-3 py-1 text-xs">
          Tenant: cybermind-master-tenant
        </Badge>
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
          <Users className="w-4 h-4" /> Users & Permissions
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
          <Key className="w-4 h-4" /> AI Models & Keys
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Key Platform Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Server CPU Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">25.4%</div>
                <p className="text-xs text-emerald-400 mt-1">Normal load (4 cores)</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">RAM Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">48.9%</div>
                <p className="text-xs text-muted-foreground mt-1">7.8 GB / 16.0 GB</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Active Microservices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-400">4 / 4 Online</div>
                <p className="text-xs text-muted-foreground mt-1">PM2 cluster healthy</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Telemetry Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">14.2k eps</div>
                <p className="text-xs text-emerald-400 mt-1">⚡ Redpanda Ingestion Active</p>
              </CardContent>
            </Card>
          </div>

          {/* Microservices Status Grid */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">PM2 Process & Microservice Governance</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Managed daemon processes running on current host node.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: '3', name: 'cybermind-console', mode: 'fork', status: 'online', memory: '49.9mb', cpu: '0%' },
                  { id: '2', name: 'cybermind-api', mode: 'fork', status: 'online', memory: '104.8mb', cpu: '0%' },
                  { id: '0', name: 'vellprint-api', mode: 'fork', status: 'online', memory: '58.7mb', cpu: '0%' },
                  { id: '1', name: 'redpanda-kafka-stream', mode: 'cluster', status: 'online', memory: '142.0mb', cpu: '1.2%' },
                ].map((proc) => (
                  <div key={proc.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/60">
                    <div className="flex items-center gap-3">
                      <Server className="w-4 h-4 text-primary" />
                      <div>
                        <span className="font-semibold text-sm text-foreground">{proc.name}</span>
                        <span className="text-xs text-muted-foreground block font-mono">PID #{proc.id} • mode: {proc.mode}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="font-mono text-muted-foreground">{proc.memory}</span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {proc.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">User Directory & Role Access</h2>
            <Button size="sm" onClick={() => showToast('User invite link copied to clipboard')} className="bg-primary gap-1.5 text-xs">
              <UserPlus className="w-3.5 h-3.5" /> Invite New Analyst
            </Button>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {users.map((u) => (
                  <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{u.name}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{u.role}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{u.email}</p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">Last login: {u.lastLogin}</span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {u.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: CONVERSATIONS AUDIT */}
      {activeTab === 'CONVERSATIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Global CyberAI Audit Log</h2>
              <p className="text-xs text-muted-foreground">Super admin oversight across all active user sessions.</p>
            </div>
            <Link href="/copilot">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                Open CyberAI Console <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-3">
              {[
                { id: 'conv-seeded-1', title: 'Ransomware Canary Triggered - DB-01', user: 'admin@cybermind.local', model: 'Google Gemini 3.6 Flash', count: 2, time: '3 hours ago' },
                { id: 'conv-seeded-2', title: 'SSH Brute Force Threat Intelligence', user: 'admin@cybermind.local', model: 'Groq GPT-OSS 120B', count: 2, time: '10 hours ago' },
              ].map((c) => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-muted/40 rounded-xl border border-border/60 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{c.title}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{c.model}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">User: {c.user} • {c.count} messages • {c.time}</p>
                  </div>

                  <Link href={`/copilot?id=${c.id}`}>
                    <Button size="sm" variant="ghost" className="text-xs gap-1">
                      View Chat <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: AI MODELS */}
      {activeTab === 'AI_PROVIDERS' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">AI Gateway & Model Providers</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p, idx) => (
              <Card key={idx} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{p.name}</CardTitle>
                    <Badge className={p.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-muted text-muted-foreground'}>
                      {p.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs font-mono">{p.model}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Role / Priority:</span>
                    <span className="text-foreground font-medium">{p.style}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Latency:</span>
                    <span className="text-emerald-400 font-mono font-medium">{p.latency}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>API Key Configured:</span>
                    <span className="text-emerald-400 font-semibold">Yes (Verified)</span>
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
