'use client';

import React, { useState } from 'react';
import { 
  CyberPageHeader, 
  CyberCard, 
  CyberMetric, 
  CyberSkeleton 
} from '../../components/cybermind/CyberPrimitives';
import { CyberSeverityBadge, CyberStatusBadge } from '../../components/cybermind/CyberBadges';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { 
  BookOpen, 
  Play, 
  CheckCircle2, 
  Zap, 
  Clock, 
  Search, 
  ShieldAlert, 
  Lock, 
  RefreshCw 
} from 'lucide-react';

interface Playbook {
  id: string;
  name: string;
  category: 'CONTAINMENT' | 'ENRICHMENT' | 'FORENSICS' | 'REMEDIATION';
  triggerType: 'AUTOMATIC' | 'MANUAL';
  description: string;
  executionsTotal: number;
  successRate: string;
  avgDuration: string;
  lastRun: string;
  enabled: boolean;
}

const INITIAL_PLAYBOOKS: Playbook[] = [
  {
    id: 'PB-ISOLATE-HOST',
    name: 'Automatic Network Host Quarantine',
    category: 'CONTAINMENT',
    triggerType: 'AUTOMATIC',
    description: 'Triggers on Ransomware Canary breach. Immediately injects SDN drop rules and isolates host from local subnets.',
    executionsTotal: 142,
    successRate: '100%',
    avgDuration: '0.8s',
    lastRun: '14 minutes ago',
    enabled: true,
  },
  {
    id: 'PB-REVOKE-CREDS',
    name: 'Active Session Invalidation & Password Reset',
    category: 'REMEDIATION',
    triggerType: 'AUTOMATIC',
    description: 'Forces OAuth token revocation, invalidates active JWT sessions, and flags AD user accounts for mandatory credential reset.',
    executionsTotal: 89,
    successRate: '98.8%',
    avgDuration: '1.4s',
    lastRun: '1 hour ago',
    enabled: true,
  },
  {
    id: 'PB-ENRICH-IP',
    name: 'Threat Intel & GeoIP Data Enrichment',
    category: 'ENRICHMENT',
    triggerType: 'AUTOMATIC',
    description: 'Queries AbuseIPDB, VirusTotal, and internal SIEM logs for attacker IP reputation scoring and WHOIS attribution.',
    executionsTotal: 2410,
    successRate: '99.9%',
    avgDuration: '0.3s',
    lastRun: '2 minutes ago',
    enabled: true,
  },
  {
    id: 'PB-SIEM-BLOCK-IP',
    name: 'Edge Gateway Firewall Rule Injection',
    category: 'CONTAINMENT',
    triggerType: 'MANUAL',
    description: 'Pushes temporary 24-hour IP drop rules directly to Cloudflare WAF and Palo Alto Perimeter Firewalls.',
    executionsTotal: 512,
    successRate: '100%',
    avgDuration: '1.1s',
    lastRun: '3 hours ago',
    enabled: true,
  },
];

export default function PlaybooksPage() {
  const [playbooks] = useState<Playbook[]>(INITIAL_PLAYBOOKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRunPlaybook = (id: string, name: string) => {
    setExecutingId(id);
    setTimeout(() => {
      setExecutingId(null);
      setToastMessage(`⚡ Playbook "${name}" executed successfully across SOAR engine!`);
      setTimeout(() => setToastMessage(null), 4000);
    }, 1200);
  };

  const filteredPlaybooks = playbooks.filter((pb) => {
    const matchesCat = filterCategory === 'ALL' || pb.category === filterCategory;
    const matchesQuery =
      pb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pb.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pb.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <CyberPageHeader
        title="SOAR Automated Response Playbooks"
        description="Automated security orchestration, active host isolation, IP blocking, and incident response playbooks."
        breadcrumbs={[
          { label: 'CyberMind OS', href: '/dashboard' },
          { label: 'Security Analysis' },
          { label: 'Playbooks' },
        ]}
        badge={
          <Badge variant="outline" className="font-mono text-xs border-cyan-500/40 text-cyan-400 bg-cyan-500/10 font-bold">
            SOAR Engine Active
          </Badge>
        }
      />

      {toastMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {toastMessage}
        </div>
      )}

      {/* 2. Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CyberMetric title="Active Playbooks" value="4 Ready" icon={<Zap className="w-4 h-4 text-cyan-400" />} />
        <CyberMetric title="Automated Runs (30d)" value="3,187" accentColor="cyan" />
        <CyberMetric title="Execution Success Rate" value="99.4%" accentColor="emerald" />
        <CyberMetric title="Avg Response Latency" value="0.9s" accentColor="blue" />
      </div>

      {/* 3. Search & Filter Bar */}
      <CyberCard className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 shrink-0" />
            <Input
              placeholder="Search playbooks or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 bg-slate-900/80 border-slate-800 text-xs font-mono focus:border-cyan-500/50"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {['ALL', 'CONTAINMENT', 'ENRICHMENT', 'REMEDIATION'].map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={filterCategory === cat ? 'default' : 'outline'}
                onClick={() => setFilterCategory(cat)}
                className={`h-7 px-2.5 text-[11px] font-mono capitalize ${
                  filterCategory === cat
                    ? 'bg-cyan-600 text-slate-950 font-bold'
                    : 'border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </CyberCard>

      {/* 4. Playbook Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPlaybooks.map((pb) => (
          <CyberCard key={pb.id} hoverEffect className="p-4 space-y-3 font-mono text-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-cyan-400">{pb.id}</span>
                <CyberStatusBadge status={pb.triggerType} />
              </div>
              <h3 className="text-sm font-bold text-slate-100">{pb.name}</h3>
              <p className="text-slate-400 text-xs font-sans leading-relaxed">{pb.description}</p>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="grid grid-cols-3 gap-2 bg-slate-900 p-2 rounded text-center text-[11px]">
                <div>
                  <span className="text-slate-500 text-[10px] block">EXECUTIONS</span>
                  <span className="font-bold text-slate-200">{pb.executionsTotal}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">SUCCESS</span>
                  <span className="font-bold text-emerald-400">{pb.successRate}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">AVG TIME</span>
                  <span className="font-bold text-slate-200">{pb.avgDuration}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">Last run: {pb.lastRun}</span>
                <Button
                  size="sm"
                  disabled={executingId === pb.id}
                  onClick={() => handleRunPlaybook(pb.id, pb.name)}
                  className="h-7 px-3 text-[11px] font-mono bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold gap-1.5"
                >
                  {executingId === pb.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Executing SOAR...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Execute Playbook
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CyberCard>
        ))}
      </div>
    </div>
  );
}
