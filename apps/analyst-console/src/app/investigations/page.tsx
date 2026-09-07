'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  Server
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

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
}

const INITIAL_CASES: InvestigationCase[] = [
  {
    id: 'INV-2026-8812',
    title: 'Ransomware Canary Decoy Breach - Host DB-01',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    host: 'DB-01.corp.local',
    ip: '10.0.4.12',
    assignee: 'CYBERMIND Autonomous CyberAI',
    ttps: ['T1486 Data Encrypted', 'T1059.001 PowerShell', 'T1078 Valid Accounts'],
    createdAt: '14 minutes ago',
    updatedAt: 'Just now',
    description: 'Honey-token decoy file modified by unauthorized process svchost_update.exe. High entropy detected.',
  },
  {
    id: 'INV-2026-8811',
    title: 'SSH Brute Force Threat Intelligence & Botnet Activity',
    severity: 'HIGH',
    status: 'CONTAINED',
    host: 'GW-EDGE-01',
    ip: '198.51.100.23',
    assignee: 'Analyst (admin@cybermind.local)',
    ttps: ['T1110.001 Password Guessing', 'T1090 Proxy C2'],
    createdAt: '3 hours ago',
    updatedAt: '1 hour ago',
    description: '1,420 failed SSH attempts across 3 minutes targeting root, admin, ubuntu. Edge IP drop rule applied.',
  },
  {
    id: 'INV-2026-8809',
    title: 'Suspicious Active Directory Kerberoasting Attempt',
    severity: 'HIGH',
    status: 'IN_PROGRESS',
    host: 'DC-PRIMARY.corp.local',
    ip: '10.0.1.5',
    assignee: 'Analyst (admin@cybermind.local)',
    ttps: ['T1558.003 Kerberoasting', 'T1003 OS Credential Dumping'],
    createdAt: '6 hours ago',
    updatedAt: '2 hours ago',
    description: 'Multiple TGS requests for service accounts with weak SPN encryption algorithms.',
  },
  {
    id: 'INV-2026-8804',
    title: 'DNS Tunneling Telemetry Exfiltration Stream',
    severity: 'MEDIUM',
    status: 'CLOSED',
    host: 'WORKSTATION-44',
    ip: '10.0.8.99',
    assignee: 'CYBERMIND Autonomous CyberAI',
    ttps: ['T1071.004 DNS C2', 'T1048 Exfiltration Over Alternative Protocol'],
    createdAt: '1 day ago',
    updatedAt: '18 hours ago',
    description: 'High volume of TXT queries to dynamic domain ns1.evil-domain.xyz. Sinkholed by DNS firewall.',
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

  const getSeverityBadge = (sev: InvestigationCase['severity']) => {
    switch (sev) {
      case 'CRITICAL':
        return <Badge variant="destructive" className="bg-red-600 text-white font-bold">CRITICAL</Badge>;
      case 'HIGH':
        return <Badge variant="destructive" className="bg-orange-500 text-white font-bold">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-amber-500 text-black font-medium">MEDIUM</Badge>;
      case 'LOW':
        return <Badge variant="outline">LOW</Badge>;
    }
  };

  const getStatusBadge = (st: InvestigationCase['status']) => {
    switch (st) {
      case 'ACTIVE':
        return <Badge className="bg-red-500/10 text-red-500 border border-red-500/20">Active Breach</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20">Investigating</Badge>;
      case 'CONTAINED':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Contained</Badge>;
      case 'CLOSED':
        return <Badge variant="outline" className="text-muted-foreground">Closed</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="w-7 h-7 text-primary" />
            Threat Investigations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time incident response, MITRE ATT&CK correlation, and automated triage telemetry.
          </p>
        </div>
        <Link href="/copilot">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Investigate with CyberAI
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">1 Critical</div>
            <p className="text-xs text-muted-foreground mt-1">Ransomware Canary on DB-01</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">2 Cases</div>
            <p className="text-xs text-muted-foreground mt-1">Assigned to SOC analysts</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Contained Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">8 Threats</div>
            <p className="text-xs text-muted-foreground mt-1">SOAR playbooks executed</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Mean Time to Detect (MTTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1.4 Seconds</div>
            <p className="text-xs text-emerald-500 mt-1">⚡ 94% faster via Sigma Engine</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls / Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search cases, hosts, IPs, or TTPs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted border border-border text-foreground text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'ACTIVE', 'IN_PROGRESS', 'CONTAINED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === st
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Case Grid / List */}
      <div className="space-y-4">
        {filteredCases.map((c) => (
          <Card key={c.id} className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-primary font-semibold">{c.id}</span>
                    {getSeverityBadge(c.severity)}
                    {getStatusBadge(c.status)}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {c.createdAt}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold tracking-tight text-foreground">{c.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono bg-muted px-2 py-0.5 rounded text-[11px]">
                      <Server className="w-3 h-3 text-muted-foreground" /> {c.host} ({c.ip})
                    </span>
                    <span className="flex items-center gap-1 font-mono bg-muted px-2 py-0.5 rounded text-[11px]">
                      <UserCheck className="w-3 h-3 text-muted-foreground" /> {c.assignee}
                    </span>
                  </div>

                  {/* MITRE ATT&CK Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {c.ttps.map((ttp, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-secondary text-secondary-foreground font-mono px-2 py-0.5 rounded border border-border"
                      >
                        {ttp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start lg:self-center">
                  <Link href={`/copilot?alertId=${c.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      Analyze in CyberAI <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
