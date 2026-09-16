'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CyberPageHeader, 
  CyberCard, 
  CyberMetric, 
  CyberSkeleton, 
  CyberEmptyState,
  CyberTimeline
} from '../../components/cybermind/CyberPrimitives';
import { CyberSeverityBadge, CyberStatusBadge } from '../../components/cybermind/CyberBadges';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { 
  Activity, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Shield, 
  ChevronRight, 
  ExternalLink,
  UserCheck,
  Server,
  Bot,
  Layers,
  FileText,
  Plus
} from 'lucide-react';

interface InvestigationCase {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'IN_PROGRESS' | 'CONTAINED' | 'CLOSED';
  host: string;
  ip: string;
  assignee: string;
  ttps: string[];
  createdAt: string;
  updatedAt: string;
  description: string;
  riskScore: number;
}

const INITIAL_CASES: InvestigationCase[] = [
  {
    id: 'INC-2026-0192',
    title: 'Fortinet SSL VPN RCE Exploitation (CVE-2024-21762)',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    host: 'vpn-gateway-primary.corp.local',
    ip: '45.148.10.92',
    assignee: 'Analyst (You)',
    ttps: ['T1190 Exploit Public-Facing App', 'T1059 Command and Scripting', 'T1071 C2 Protocol'],
    createdAt: '14 minutes ago',
    updatedAt: 'Just now',
    description: 'CISA KEV correlated RCE payload executed against SSL VPN endpoint. Outbound connection initiated.',
    riskScore: 94,
  },
  {
    id: 'INC-2026-0188',
    title: 'Ransomware Canary Decoy Breach - Host DB-01',
    severity: 'CRITICAL',
    status: 'IN_PROGRESS',
    host: 'DB-01.corp.local',
    ip: '10.0.4.12',
    assignee: 'CYBERMIND Autonomous Copilot',
    ttps: ['T1486 Data Encrypted', 'T1059.001 PowerShell', 'T1078 Valid Accounts'],
    createdAt: '2 hours ago',
    updatedAt: '12m ago',
    description: 'Honey-token decoy file modified by unauthorized process svchost_update.exe. High entropy detected.',
    riskScore: 88,
  },
  {
    id: 'INC-2026-0182',
    title: 'SSH Brute Force Threat Intelligence & Botnet Activity',
    severity: 'HIGH',
    status: 'CONTAINED',
    host: 'GW-EDGE-01',
    ip: '198.51.100.23',
    assignee: 'SOC Lead',
    ttps: ['T1110.001 Password Guessing', 'T1090 Proxy C2'],
    createdAt: '5 hours ago',
    updatedAt: '1 hour ago',
    description: '1,420 failed SSH attempts across 3 minutes targeting root, admin, ubuntu. Edge IP drop rule applied.',
    riskScore: 72,
  },
];

export default function InvestigationsPage() {
  const [cases] = useState<InvestigationCase[]>(INITIAL_CASES);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredCases = cases.filter((c) => {
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesQuery =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ip.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <CyberPageHeader
        title="Incident Investigations Workspace"
        description="First-class incident response workspace, chronological timeline, evidence correlation, and automated containment."
        breadcrumbs={[
          { label: 'CyberMind OS', href: '/dashboard' },
          { label: 'Operations' },
          { label: 'Investigations' },
        ]}
        badge={<Badge variant="outline" className="font-mono text-xs border-cyan-500/40 text-cyan-400 bg-cyan-500/10 font-bold">{filteredCases.length} Active Cases</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/copilot">
              <Button size="sm" variant="outline" className="h-8 text-xs font-mono border-slate-700 hover:border-cyan-500/50">
                <Bot className="w-3.5 h-3.5 mr-1.5 text-cyan-400 shrink-0" />
                Ask CyberAI
              </Button>
            </Link>
            <Link href="/investigations/INC-2026-0192">
              <Button size="sm" className="h-8 text-xs font-mono bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold">
                <Plus className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                + New Investigation
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CyberMetric
          title="Active Critical Incidents"
          value="2"
          subtitle="Requires SOC Lead Escalation"
          icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
          accentColor="red"
          badge={<Badge variant="destructive" className="font-mono text-[10px] bg-red-500/20 text-red-400 border-red-500/40">CRITICAL</Badge>}
        />
        <CyberMetric
          title="In-Progress Triage"
          value="1"
          subtitle="Assigned to CyberAI Copilot"
          icon={<Bot className="w-4 h-4 text-cyan-400" />}
          accentColor="cyan"
        />
        <CyberMetric
          title="Contained Today"
          value="8"
          subtitle="SOAR Playbooks Executed"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          accentColor="emerald"
        />
        <CyberMetric
          title="Mean Time To Contain"
          value="3.2m"
          subtitle="⚡ 88% faster with CyberMind"
          icon={<Clock className="w-4 h-4 text-blue-400" />}
          accentColor="blue"
        />
      </div>

      {/* 3. Filter Controls */}
      <CyberCard className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 shrink-0" />
            <Input
              placeholder="Search case title, INC ID, target host, IP, or TTP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 bg-slate-900/80 border-slate-800 text-xs font-mono focus:border-cyan-500/50"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 text-xs flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" /> Status:
            </span>
            {['ALL', 'ACTIVE', 'IN_PROGRESS', 'CONTAINED', 'CLOSED'].map((st) => (
              <Button
                key={st}
                size="sm"
                variant={filterStatus === st ? 'default' : 'outline'}
                onClick={() => setFilterStatus(st)}
                className={`h-7 px-2.5 text-[11px] font-mono capitalize ${
                  filterStatus === st
                    ? 'bg-cyan-600 text-slate-950 font-bold'
                    : 'border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </Button>
            ))}
          </div>
        </div>
      </CyberCard>

      {/* 4. Investigation Cases List */}
      <div className="space-y-4">
        {filteredCases.map((c) => (
          <CyberCard key={c.id} hoverEffect className="p-4 sm:p-5 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 font-mono text-xs">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-cyan-400 text-sm">{c.id}</span>
                  <CyberSeverityBadge severity={c.severity} />
                  <CyberStatusBadge status={c.status} />
                  <span className="text-slate-500 text-[11px] flex items-center gap-1 ml-auto sm:ml-0">
                    <Clock className="w-3 h-3" /> {c.createdAt}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100">{c.title}</h3>
                <p className="text-slate-400 text-xs font-sans leading-relaxed">{c.description}</p>

                {/* Metadata & Affected Target */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-slate-400">
                  <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px]">
                    <Server className="w-3 h-3 text-cyan-400" /> {c.host} ({c.ip})
                  </span>
                  <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px]">
                    <UserCheck className="w-3 h-3 text-cyan-400" /> Owner: <strong className="text-slate-200">{c.assignee}</strong>
                  </span>
                  <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] text-red-400 font-bold">
                    Risk Score: {c.riskScore}/100
                  </span>
                </div>

                {/* MITRE ATT&CK Mapping */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {c.ttps.map((ttp, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="bg-slate-900 border-slate-800 text-slate-300 font-mono text-[10px]"
                    >
                      {ttp}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                <Link href={`/investigations/${c.id}`}>
                  <Button size="sm" className="h-8 text-xs font-mono bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold gap-1">
                    Open Investigation Workspace <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CyberCard>
        ))}
      </div>
    </div>
  );
}
