'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Layers, 
  Server, 
  Terminal, 
  Shield, 
  CheckCircle2, 
  ExternalLink, 
  Bot, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  Globe, 
  Lock, 
  Cpu, 
  RefreshCw,
  X,
  Activity
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CyberSeverityBadge, CyberStatusBadge } from '../cybermind/CyberBadges';
import Link from 'next/link';

export interface CyberContextPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  activeCaseId?: string;
  activeCve?: string;
  activeIp?: string;
  onSelectAction?: (action: string) => void;
  className?: string;
}

export function CyberContextPanel({
  isOpen,
  onToggle,
  activeCaseId = 'INC-2026-0192',
  activeCve = 'CVE-2024-21762',
  activeIp = '185.220.101.5',
  onSelectAction,
  className = '',
}: CyberContextPanelProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EVIDENCE' | 'TOOLS' | 'SOURCES'>('OVERVIEW');

  // Context Data
  const investigationContext = {
    id: activeCaseId,
    status: 'ACTIVE',
    riskScore: 94,
    severity: 'CRITICAL',
    owner: 'Analyst (You)',
    affectedAssets: [
      { name: 'vpn-gateway-primary.corp.local', ip: '10.0.1.254', type: 'Gateway' },
      { name: 'DB-01.corp.local', ip: '10.0.4.12', type: 'Database' },
      { name: 'workstation-fin-04', ip: '10.0.8.99', type: 'Endpoint' },
    ],
    evidenceItems: [
      { id: 1, name: 'fortissl_rce_payload.raw', type: 'HTTP POST Log', lines: '184–191', risk: 'CRITICAL' },
      { id: 2, name: 'c2_beacon_stream.pcap', type: 'PCAP Capture', lines: 'Packet #412', risk: 'HIGH' },
      { id: 3, name: 'fortigate-prod.conf', type: 'Firewall Config', lines: 'Rule #42', risk: 'HIGH' },
    ],
    correlatedCves: [
      { id: 'CVE-2024-21762', score: 9.8, kev: true, title: 'FortiOS RCE Exploit' },
      { id: 'CVE-2026-20079', score: 8.8, kev: true, title: 'Cisco FMC Command Injection' },
    ],
    toolsExecuted: [
      { name: 'CVE Intelligence Engine', status: 'SUCCESS', latency: '42ms' },
      { name: 'Firewall Policy Audit', status: 'SUCCESS', latency: '68ms' },
      { name: 'IP Reputation Lookup', status: 'SUCCESS', latency: '35ms' },
      { name: 'RAG Knowledge Vector Search', status: 'SUCCESS', latency: '120ms' },
      { name: 'MITRE ATT&CK Mapper', status: 'SUCCESS', latency: '18ms' },
    ],
    retrievedSources: [
      { title: 'NVD CVE-2024-21762 Specification', url: 'https://nvd.nist.gov', type: 'NVD' },
      { title: 'CISA Known Exploited Vulnerabilities Catalog', url: 'https://cisa.gov', type: 'CISA KEV' },
      { title: 'Internal SOC Playbook #PB-ISOLATE-HOST', url: '#', type: 'Internal KB' },
      { title: 'Zscaler ThreatLabz Advisory (Fortinet RCE)', url: '#', type: 'CTI Feed' },
    ]
  };

  if (!isOpen) return null;

  return (
    <aside
      className={`bg-slate-950/95 border-l border-slate-800/80 flex flex-col h-full font-mono text-xs text-slate-300 shrink-0 shadow-xl select-none ${className}`}
    >
      {/* 1. Header with Collapse Toggle */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-bold text-slate-100 uppercase tracking-wider text-xs">
            Investigation Cockpit
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggle}
          className="h-6 w-6 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          title="Collapse Context Panel"
        >
          <X className="w-4 h-4 shrink-0" />
        </Button>
      </div>

      {/* 2. Active Case Quick Bar */}
      <div className="p-3 bg-slate-900/40 border-b border-slate-800/80 space-y-2 shrink-0">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">INCIDENT CASE</span>
          <CyberSeverityBadge severity={investigationContext.severity} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-cyan-400">{investigationContext.id}</span>
          <span className="text-xs font-bold text-red-400">Risk: {investigationContext.riskScore}/100</span>
        </div>
      </div>

      {/* 3. Sub-Nav Tabs */}
      <div className="flex items-center border-b border-slate-800/80 text-[11px] bg-slate-950 px-2 pt-1 gap-1 shrink-0 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Context' },
          { id: 'EVIDENCE', label: 'Evidence (3)' },
          { id: 'TOOLS', label: 'Tools (5)' },
          { id: 'SOURCES', label: 'Sources (4)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-2.5 py-1.5 font-semibold transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* OVERVIEW TAB */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-4">
            {/* Affected Infrastructure */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-400" /> Affected Assets ({investigationContext.affectedAssets.length})
              </span>
              <div className="space-y-1.5">
                {investigationContext.affectedAssets.map((asset, i) => (
                  <div key={i} className="p-2 bg-slate-900/80 border border-slate-800/80 rounded flex items-center justify-between text-[11px]">
                    <div className="truncate max-w-[170px]">
                      <div className="font-semibold text-slate-200 truncate">{asset.name}</div>
                      <div className="text-slate-500 text-[10px]">{asset.ip}</div>
                    </div>
                    <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-300 font-mono">
                      {asset.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Correlated Vulnerabilities */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-orange-400" /> Correlated CVEs ({investigationContext.correlatedCves.length})
              </span>
              <div className="space-y-1.5">
                {investigationContext.correlatedCves.map((cve) => (
                  <div key={cve.id} className="p-2 bg-slate-900/80 border border-slate-800/80 rounded flex items-center justify-between text-[11px]">
                    <div>
                      <div className="font-bold text-orange-400">{cve.id}</div>
                      <div className="text-slate-400 text-[10px] truncate max-w-[150px]">{cve.title}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-red-400 font-bold text-[11px] block">{cve.score}</span>
                      {cve.kev && <Badge variant="destructive" className="text-[8px] px-1 py-0 bg-orange-500/20 text-orange-400 border-orange-500/40">KEV</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EVIDENCE TAB */}
        {activeTab === 'EVIDENCE' && (
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Evidence & Indicators
            </span>
            {investigationContext.evidenceItems.map((item) => (
              <div key={item.id} className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-100 truncate max-w-[180px]">{item.name}</span>
                  <CyberSeverityBadge severity={item.risk} />
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>Type: {item.type}</span>
                  <span className="text-cyan-400 font-bold">{item.lines}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TOOLS TAB */}
        {activeTab === 'TOOLS' && (
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Security Tools Executed
            </span>
            {investigationContext.toolsExecuted.map((t, idx) => (
              <div key={idx} className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-slate-200">{t.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{t.latency}</span>
              </div>
            ))}
          </div>
        )}

        {/* SOURCES TAB */}
        {activeTab === 'SOURCES' && (
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" /> Retrieved RAG Sources
            </span>
            {investigationContext.retrievedSources.map((src, idx) => (
              <a
                key={idx}
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded hover:border-slate-700/80 transition-colors block space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-cyan-400 truncate max-w-[190px]">{src.title}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                </div>
                <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-400">
                  {src.type}
                </Badge>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* 5. Contextual Action Buttons */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 space-y-2 shrink-0">
        <Link href={`/investigations/${investigationContext.id}`}>
          <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs h-8">
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Open Incident Workspace →
          </Button>
        </Link>
      </div>
    </aside>
  );
}
