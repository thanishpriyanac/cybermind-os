'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { 
  CyberPageHeader, 
  CyberCard, 
  CyberMetric, 
  CyberSkeleton, 
  CyberEmptyState,
  CyberTimeline,
  TimelineEvent
} from '../../../components/cybermind/CyberPrimitives';
import { CyberSeverityBadge, CyberStatusBadge } from '../../../components/cybermind/CyberBadges';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  PlayCircle, 
  Shield, 
  Activity, 
  Bot, 
  Layers, 
  Clock, 
  FileText, 
  Server, 
  Terminal, 
  ExternalLink, 
  CheckCircle2, 
  Lock, 
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

export default function InvestigationDetail({ routeId }: { routeId?: string } = {}) {
  const params = useParams();
  const alertId = routeId || (params?.id as string) || 'INC-2026-0192';

  const { data: alertData, isLoading } = useQuery({
    queryKey: ['alert', alertId],
    queryFn: async () => {
      try {
        const res = await api.get(`/v1/events/alerts/${alertId}`);
        return res.data;
      } catch {
        return {
          id: alertId,
          title: 'Fortinet SSL VPN RCE Exploitation (CVE-2024-21762)',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          source: 'Perimeter Sensor & CISA KEV Feed',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date().toISOString(),
          riskScore: 94,
          owner: 'Analyst (You)',
          targetHost: 'vpn-gateway-primary.corp.local',
          targetIp: '45.148.10.92',
          description: 'CISA KEV correlated RCE payload executed against SSL VPN endpoint. Outbound C2 connection initiated to 185.220.101.5.',
          timelineEvents: [
            { id: '1', time: '09:14:02', title: 'Perimeter Alert Triggered', description: 'HTTP POST exploit payload detected targeting /remote/login.', type: 'alert' },
            { id: '2', time: '09:18:15', title: 'Analyst Assigned', description: 'SOC Lead assigned case to primary analyst queue.', type: 'analyst', user: 'SOC Lead' },
            { id: '3', time: '09:21:40', title: 'IP Intelligence Enriched', description: 'AbuseIPDB query classified 45.148.10.92 as Malicious (Confidence 98%).', type: 'enrichment' },
            { id: '4', time: '09:25:10', title: 'CVE Correlation Matched', description: 'Vulnerability CVE-2024-21762 (CVSS 9.8 Critical, CISA KEV) linked.', type: 'cve' },
            { id: '5', time: '09:31:05', title: 'VAPT Audit Finding Correlated', description: 'Unpatched FortiOS firmware v7.2.1 identified in VAPT report.', type: 'vapt' },
            { id: '6', time: '09:36:20', title: 'CyberAI Playbook Triggered', description: 'Emergency edge containment rule prepared for execution.', type: 'ai' }
          ] as TimelineEvent[],
          evidenceItems: [
            { id: 1, type: 'Process', value: 'fortissl_handler.elf', status: 'MALICIOUS' },
            { id: 2, type: 'C2 Indicator IP', value: '185.220.101.5', status: 'MALICIOUS' },
            { id: 3, type: 'Exploit CVE', value: 'CVE-2024-21762', status: 'CRITICAL' },
            { id: 4, type: 'SSL Certificate Hash', value: 'sha256:8f4c2b01e3a992a...', status: 'CORRELATED' }
          ]
        };
      }
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CyberSkeleton className="h-12 w-full" />
        <CyberSkeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <CyberPageHeader
        title={alertData?.title || 'Incident Investigation Workspace'}
        description={`Case ID: ${alertData?.id} • Target Host: ${alertData?.targetHost} (${alertData?.targetIp})`}
        breadcrumbs={[
          { label: 'CyberMind OS', href: '/dashboard' },
          { label: 'Investigations', href: '/investigations' },
          { label: alertData?.id || 'INC-2026-0192' }
        ]}
        badge={<CyberSeverityBadge severity={alertData?.severity || 'CRITICAL'} />}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/investigations">
              <Button size="sm" variant="outline" className="h-8 text-xs font-mono border-slate-700 text-slate-300">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                Back to Cases
              </Button>
            </Link>
            <Link href={`/copilot?query=Analyze+investigation+${alertData?.id}`}>
              <Button size="sm" className="h-8 text-xs font-mono bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold">
                <Bot className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                Analyze in CyberAI
              </Button>
            </Link>
          </div>
        }
      />

      {/* Case Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <CyberCard className="p-3 border-l-4 border-l-red-500">
          <span className="text-slate-500 text-[10px] uppercase">Incident Risk Index</span>
          <div className="text-xl font-bold text-slate-100">{alertData?.riskScore || 94}/100</div>
          <span className="text-red-400 text-[10px]">CRITICAL EXPOSURE</span>
        </CyberCard>

        <CyberCard className="p-3 border-l-4 border-l-cyan-500">
          <span className="text-slate-500 text-[10px] uppercase">Incident Status</span>
          <div className="mt-1"><CyberStatusBadge status={alertData?.status || 'ACTIVE'} /></div>
          <span className="text-slate-400 text-[10px]">Active Investigation</span>
        </CyberCard>

        <CyberCard className="p-3 border-l-4 border-l-purple-500">
          <span className="text-slate-500 text-[10px] uppercase">Assigned Owner</span>
          <div className="text-sm font-bold text-slate-200 mt-1">{alertData?.owner || 'Analyst (You)'}</div>
          <span className="text-slate-400 text-[10px]">Tier-2 SOC Escalation</span>
        </CyberCard>

        <CyberCard className="p-3 border-l-4 border-l-yellow-500">
          <span className="text-slate-500 text-[10px] uppercase">Detection Source</span>
          <div className="text-xs font-bold text-slate-200 truncate mt-1">{alertData?.source}</div>
          <span className="text-slate-400 text-[10px]">Live Telemetry Sensor</span>
        </CyberCard>
      </div>

      {/* Main Multi-Tab Investigation Deck */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="bg-slate-950 border border-slate-800 p-1 flex items-center gap-1 font-mono text-xs overflow-x-auto">
          <TabsTrigger value="timeline" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-slate-950 font-bold px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 mr-1.5 inline" /> Timeline
          </TabsTrigger>
          <TabsTrigger value="evidence" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-slate-950 font-bold px-3 py-1.5">
            <Terminal className="w-3.5 h-3.5 mr-1.5 inline" /> Evidence & Indicators
          </TabsTrigger>
          <TabsTrigger value="cve" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-slate-950 font-bold px-3 py-1.5">
            <Shield className="w-3.5 h-3.5 mr-1.5 inline" /> Vulnerabilities (CVE)
          </TabsTrigger>
          <TabsTrigger value="actions" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-slate-950 font-bold px-3 py-1.5">
            <Lock className="w-3.5 h-3.5 mr-1.5 inline" /> Containment Actions
          </TabsTrigger>
        </TabsList>

        {/* 1. Timeline Tab */}
        <TabsContent value="timeline">
          <CyberCard className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                Chronological Incident Timeline
              </h3>
              <span className="text-xs font-mono text-slate-400">6 Events Recorded</span>
            </div>

            <CyberTimeline events={alertData?.timelineEvents || []} />
          </CyberCard>
        </TabsContent>

        {/* 2. Evidence Tab */}
        <TabsContent value="evidence">
          <CyberCard className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                Correlated Evidence & Artifacts
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {alertData?.evidenceItems.map((item: any) => (
                <div key={item.id} className="p-3 bg-slate-900 border border-slate-800 rounded flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-slate-500 text-[10px] uppercase">{item.type}</span>
                    <div className="text-slate-200 font-bold">{item.value}</div>
                  </div>
                  <CyberSeverityBadge severity={item.status === 'MALICIOUS' ? 'CRITICAL' : 'HIGH'} />
                </div>
              ))}
            </div>
          </CyberCard>
        </TabsContent>

        {/* 3. CVE Tab */}
        <TabsContent value="cve">
          <CyberCard className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 font-mono">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Correlated Vulnerabilities (CVE-2024-21762)
              </h3>
              <Link href="/cve?search=CVE-2024-21762">
                <Button size="sm" variant="outline" className="h-7 text-xs border-orange-500/40 text-orange-400">
                  Inspect in CVE Intel <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="p-4 bg-orange-950/20 border border-orange-500/30 rounded-lg space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-orange-300 text-sm">CVE-2024-21762</span>
                <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/40">CVSS 9.8 CRITICAL</Badge>
              </div>
              <p className="text-slate-300 font-sans leading-relaxed">
                Out-of-bounds write in FortiOS web interface allows remote unauthenticated attacker to execute arbitrary code or commands via specially crafted HTTP requests.
              </p>
              <div className="pt-2 flex items-center gap-2 text-slate-400 text-[11px]">
                <span>CISA KEV Listed: <strong className="text-red-400">YES</strong></span>
                <span>• Required Action: Apply vendor updates immediately.</span>
              </div>
            </div>
          </CyberCard>
        </TabsContent>

        {/* 4. Containment Actions Tab */}
        <TabsContent value="actions">
          <CyberCard className="p-6 space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider pb-3 border-b border-slate-800">
              Automated SOAR Playbook Containment
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded space-y-3">
                <div className="flex items-center gap-2 text-slate-200 font-bold">
                  <Lock className="w-4 h-4 text-red-400" /> Isolate Target Host
                </div>
                <p className="text-slate-400 text-xs font-sans">
                  Disconnect {alertData?.targetHost} from internal network VLAN while keeping management tunnel alive.
                </p>
                <Button size="sm" variant="destructive" className="w-full h-8 font-mono text-xs">
                  Execute Host Isolation
                </Button>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded space-y-3">
                <div className="flex items-center gap-2 text-slate-200 font-bold">
                  <Shield className="w-4 h-4 text-cyan-400" /> Block C2 Indicator IP
                </div>
                <p className="text-slate-400 text-xs font-sans">
                  Push automatic drop rule for 185.220.101.5 across edge firewall policy engine.
                </p>
                <Button size="sm" className="w-full h-8 font-mono text-xs bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold">
                  Block C2 IP Address
                </Button>
              </div>
            </div>
          </CyberCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

