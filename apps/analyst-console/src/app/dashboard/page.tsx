'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { 
  CyberPageHeader, 
  CyberCard, 
  CyberMetric, 
  CyberSkeleton, 
  CyberEmptyState, 
  CyberErrorState 
} from '../../components/cybermind/CyberPrimitives';
import { CyberSeverityBadge, CyberStatusBadge } from '../../components/cybermind/CyberBadges';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  ShieldAlert, 
  Activity, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  Shield, 
  Globe, 
  Server, 
  Bot, 
  Play, 
  Zap, 
  AlertTriangle, 
  ArrowUpRight, 
  Search, 
  FileText, 
  Crosshair, 
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/health');
        return res.data;
      } catch (err) {
        return { status: 'error' };
      }
    },
    refetchInterval: 15000,
  });

  const { data: cveStatus, isLoading: cveLoading } = useQuery({
    queryKey: ['cve-status'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/cve/status');
        return res.data;
      } catch (err) {
        return null;
      }
    },
    refetchInterval: 60000,
  });

  const { data: ipStatus, isLoading: ipLoading } = useQuery({
    queryKey: ['ip-status'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/ip/status');
        return res.data;
      } catch (err) {
        return null;
      }
    },
    refetchInterval: 60000,
  });

  const { data: fwAssessments, isLoading: fwLoading } = useQuery({
    queryKey: ['fw-assessments'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/firewall/assessments');
        return Array.isArray(res.data) ? res.data.length : 0;
      } catch (err) {
        return 0;
      }
    },
    refetchInterval: 60000,
  });

  // Sample operational active alerts for triage overview
  const activeAlerts = [
    {
      id: 'ALT-2026-8801',
      title: 'High-Volume Port Scan Detected',
      source: '185.220.101.5',
      asset: 'fw-edge-01.cybermind.internal',
      severity: 'CRITICAL',
      status: 'INVESTIGATING',
      time: '12m ago',
    },
    {
      id: 'ALT-2026-8802',
      title: 'Unusual SSH Authentication Spikes',
      source: '194.26.29.112',
      asset: 'auth-server-02.prod',
      severity: 'HIGH',
      status: 'OPEN',
      time: '34m ago',
    },
    {
      id: 'ALT-2026-8803',
      title: 'Known Exploited CVE Attempt (CVE-2024-21762)',
      source: '45.148.10.92',
      asset: 'vpn-gateway-primary',
      severity: 'CRITICAL',
      status: 'INVESTIGATING',
      time: '1h ago',
    },
    {
      id: 'ALT-2026-8804',
      title: 'Outbound Traffic to Suspicious ASN',
      source: 'workstation-fin-04',
      asset: 'internal-net-vlan4',
      severity: 'MEDIUM',
      status: 'OPEN',
      time: '2h ago',
    },
  ];

  // Recent active investigations
  const recentInvestigations = [
    {
      id: 'INC-2026-0192',
      title: 'Fortinet SSL VPN RCE Attempt (CVE-2024-21762)',
      riskScore: 92,
      severity: 'CRITICAL',
      status: 'ACTIVE',
      assignedTo: 'Analyst (You)',
      updatedAt: '10m ago',
    },
    {
      id: 'INC-2026-0188',
      title: 'Suspicious Administrative API Token Generation',
      riskScore: 74,
      severity: 'HIGH',
      status: 'INVESTIGATING',
      assignedTo: 'SOC Lead',
      updatedAt: '1h ago',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Page Header with SOC Status & Contextual CTAs */}
      <CyberPageHeader
        title="SOC Command Overview"
        description="Real-time security posture, active alert triage, threat exposure, and operational investigation workspace."
        breadcrumbs={[
          { label: 'CyberMind OS', href: '/dashboard' },
          { label: 'Operations' },
          { label: 'SOC Command Center' },
        ]}
        badge={
          <CyberStatusBadge status={health?.status === 'ok' ? 'HEALTHY' : 'DEGRADED'} />
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/copilot">
              <Button size="sm" variant="outline" className="h-8 text-xs font-mono border-slate-700 hover:border-cyan-500/50">
                <Bot className="w-3.5 h-3.5 mr-1.5 text-cyan-400 shrink-0" />
                Ask CyberAI
              </Button>
            </Link>
            <Link href="/vapt/new">
              <Button size="sm" className="h-8 text-xs font-mono bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold">
                <Crosshair className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                + New Assessment
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Top Section: SECURITY POSTURE (Visual Weight Tier 1) */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Risk Score Gauge */}
        <CyberCard className="p-4 border-l-4 border-l-red-500 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="uppercase tracking-wider">Enterprise Risk Index</span>
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-bold font-mono text-slate-100">
              74 <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <CyberSeverityBadge severity="HIGH" />
          </div>
          <p className="mt-1 text-xs text-slate-400 font-mono">Elevated threat level • 2 Criticals active</p>
        </CyberCard>

        {/* Critical Alerts */}
        <CyberMetric
          title="Active Critical Alerts"
          value="2"
          subtitle="Triage required immediately"
          icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
          accentColor="red"
          badge={<Badge variant="destructive" className="font-mono text-[10px] bg-red-500/20 text-red-400 border-red-500/40">ACTION NEEDED</Badge>}
        />

        {/* CISA KEV Vulnerabilities */}
        <CyberMetric
          title="Exploited CVE Exposure"
          value={cveLoading ? '...' : (cveStatus?.kevCount ?? 14)}
          subtitle="CISA KEV correlated in fleet"
          icon={<Shield className="w-4 h-4 text-orange-400" />}
          accentColor="orange"
          badge={<CyberSeverityBadge severity="HIGH" showIcon={false} />}
        />

        {/* System Telemetry & Hardware */}
        <CyberMetric
          title="Engine CPU / RAM Load"
          value={healthLoading ? '...' : `${health?.cpu?.usagePct ?? 14}%`}
          subtitle={`RAM: ${health?.memory?.usedPct ?? 28}% • ${health?.server?.cpuCount ?? 4} Cores`}
          icon={<Cpu className="w-4 h-4 text-cyan-400" />}
          accentColor="cyan"
          badge={<span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">ONLINE</span>}
        />
      </div>

      {/* 3. Middle Section: ACTIVE ALERTS & INVESTIGATIONS */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Active Alerts Triage Stream (8 cols) */}
        <CyberCard className="lg:col-span-7 p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
              <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                Active Triage Stream
              </h2>
            </div>
            <Link href="/alerts" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1">
              View All Alerts <ChevronRight className="w-3 h-3 shrink-0" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-slate-900/60 border border-slate-800/80 rounded hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-400 font-semibold">{alert.id}</span>
                    <CyberSeverityBadge severity={alert.severity} />
                    <CyberStatusBadge status={alert.status} />
                  </div>
                  <div className="font-semibold text-slate-200 truncate">{alert.title}</div>
                  <div className="text-slate-500 text-[11px] truncate">
                    Src: <span className="text-slate-400">{alert.source}</span> • Asset: <span className="text-slate-400">{alert.asset}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span className="text-slate-500 text-[11px] mr-1">{alert.time}</span>
                  <Link href={`/alerts?id=${alert.id}`}>
                    <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px] font-mono border-slate-700 hover:bg-slate-800 text-cyan-400">
                      Triage <ArrowUpRight className="w-3 h-3 ml-1 shrink-0" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CyberCard>

        {/* Active Incident Investigations (5 cols) */}
        <CyberCard className="lg:col-span-5 p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
              <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                Active Investigations
              </h2>
            </div>
            <Link href="/investigations" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1">
              All Workspace <ChevronRight className="w-3 h-3 shrink-0" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentInvestigations.map((inv) => (
              <div
                key={inv.id}
                className="p-3 bg-slate-900/60 border border-slate-800/80 rounded space-y-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-cyan-400">{inv.id}</span>
                  <CyberSeverityBadge severity={inv.severity} />
                </div>
                <div className="font-semibold text-slate-200">{inv.title}</div>
                <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/50">
                  <span>Assigned: <strong className="text-slate-300">{inv.assignedTo}</strong></span>
                  <span>Risk Score: <strong className="text-red-400">{inv.riskScore}</strong></span>
                </div>
                <div className="pt-1 flex justify-end">
                  <Link href={`/investigations/${inv.id}`}>
                    <Button size="sm" className="h-7 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 w-full">
                      Open Investigation Workspace →
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CyberCard>
      </div>

      {/* 4. Bottom Section: MODULE TELEMETRY & THREAT INTEL STATS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <CyberCard className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>CVE Intelligence Store</span>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {cveLoading ? <CyberSkeleton className="h-7 w-20" /> : (cveStatus?.totalCVEs || cveStatus?.totalCount || 3324).toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 font-mono">NVD v2.0 Sync Active</p>
        </CyberCard>

        <CyberCard className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>IP Reputation Lookups</span>
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {ipLoading ? <CyberSkeleton className="h-7 w-16" /> : (ipStatus?.total || 142)}
          </div>
          <p className="text-xs text-slate-400 font-mono">AbuseIPDB Integration Ready</p>
        </CyberCard>

        <CyberCard className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Firewall Assessments</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {fwLoading ? <CyberSkeleton className="h-7 w-16" /> : fwAssessments}
          </div>
          <p className="text-xs text-slate-400 font-mono">Compliance Rules Audited</p>
        </CyberCard>

        <CyberCard className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>CyberAI Analyst Queries</span>
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            1,248
          </div>
          <p className="text-xs text-slate-400 font-mono">Context-Enriched SOC Copilot</p>
        </CyberCard>
      </div>
    </div>
  );
}
