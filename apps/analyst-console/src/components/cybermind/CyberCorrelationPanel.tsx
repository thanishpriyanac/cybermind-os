'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  Activity, 
  Globe, 
  Shield, 
  Server, 
  Bot, 
  Plus, 
  ArrowRight,
  ExternalLink,
  Search,
  CheckCircle2,
  ListFilter,
  FileText,
  Terminal,
  Zap
} from 'lucide-react';
import { CyberCard } from './CyberPrimitives';
import { CyberSeverityBadge } from './CyberBadges';
import { SecurityObject } from '../../lib/toolkit/types';
import { setActiveSecurityObject } from '../../lib/toolkit/store';
import { Button } from '../ui/button';

export interface CyberCorrelationPanelProps {
  object: SecurityObject;
  relatedIntel?: {
    alertsCount?: number;
    investigationsCount?: number;
    cveCount?: number;
    firewallRulesCount?: number;
    logsCount?: number;
    vaptFindingsCount?: number;
  };
  onAskCyberAI?: (prompt: string) => void;
  className?: string;
}

export function CyberCorrelationPanel({
  object,
  relatedIntel = {
    alertsCount: Math.floor(Math.random() * 4),
    investigationsCount: 1,
    cveCount: object.type === 'CVE' ? 1 : Math.floor(Math.random() * 3),
    firewallRulesCount: Math.floor(Math.random() * 5) + 1,
    logsCount: Math.floor(Math.random() * 150) + 12,
    vaptFindingsCount: Math.floor(Math.random() * 2),
  },
  onAskCyberAI,
  className = '',
}: CyberCorrelationPanelProps) {
  const router = useRouter();
  const [investigationCreated, setInvestigationCreated] = useState(false);

  const handleNavigate = (path: string, paramName = 'query') => {
    setActiveSecurityObject(object);
    router.push(`${path}?${paramName}=${encodeURIComponent(object.value)}`);
  };

  const handleCreateInvestigation = () => {
    setInvestigationCreated(true);
    setTimeout(() => {
      router.push(`/investigations?new=true&title=${encodeURIComponent(`Investigation: ${object.type} ${object.value}`)}&ioc=${encodeURIComponent(object.value)}`);
    }, 800);
  };

  const handleTriggerAI = (promptText?: string) => {
    const prompt = promptText || `Analyze ${object.type} ${object.value} from ${object.source}. Identify potential security risks, associated attack patterns, and recommended SOC triage actions.`;
    if (onAskCyberAI) {
      onAskCyberAI(prompt);
    } else {
      router.push(`/copilot?prompt=${encodeURIComponent(prompt)}`);
    }
  };

  return (
    <CyberCard className={`p-5 bg-slate-950/95 border-slate-800/90 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
              <span>Cross-Tool Correlation Engine</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                SHARED INTEL LAYER
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Target: <span className="text-cyan-300 font-semibold">{object.type}</span> &rarr; <span className="text-slate-200 font-bold">{object.value}</span>
            </p>
          </div>
        </div>

        <CyberSeverityBadge severity={object.risk} />
      </div>

      {/* Related CyberMind Data Grid */}
      <div className="mb-5">
        <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
          <ListFilter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Observed CyberMind Platform Intelligence</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div 
            onClick={() => handleNavigate('/alerts', 'search')}
            className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-red-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-mono text-[10px]">ALERTS</span>
              <ShieldAlert className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {relatedIntel.alertsCount || 0}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5 group-hover:text-cyan-400">View matches &rarr;</div>
          </div>

          <div 
            onClick={() => handleNavigate('/investigations', 'search')}
            className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-mono text-[10px]">CASES</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {relatedIntel.investigationsCount || 0}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5 group-hover:text-cyan-400">Linked cases &rarr;</div>
          </div>

          <div 
            onClick={() => handleNavigate('/cve', 'search')}
            className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-orange-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-mono text-[10px]">CVES</span>
              <Shield className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {relatedIntel.cveCount || 0}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5 group-hover:text-cyan-400">Check CVEs &rarr;</div>
          </div>

          <div 
            onClick={() => handleNavigate('/firewall', 'search')}
            className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-yellow-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-mono text-[10px]">FIREWALL</span>
              <Server className="w-3.5 h-3.5 text-yellow-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {relatedIntel.firewallRulesCount || 0}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5 group-hover:text-cyan-400">Rules hit &rarr;</div>
          </div>

          <div 
            onClick={() => handleNavigate('/toolkit/log-analyzer', 'query')}
            className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-mono text-[10px]">LOGS</span>
              <FileText className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {relatedIntel.logsCount || 0}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5 group-hover:text-cyan-400">Log events &rarr;</div>
          </div>

          <div 
            onClick={() => handleNavigate('/vapt', 'search')}
            className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-mono text-[10px]">VAPT</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {relatedIntel.vaptFindingsCount || 0}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5 group-hover:text-cyan-400">VAPT vulns &rarr;</div>
          </div>
        </div>
      </div>

      {/* Global Contextual Action Buttons */}
      <div>
        <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
          Global Contextual Pivot Actions
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CyberAI Button */}
          <Button
            onClick={() => handleTriggerAI()}
            className="h-8 text-xs font-mono font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md border border-cyan-400/30"
          >
            <Bot className="w-3.5 h-3.5 mr-1.5" />
            Ask CyberAI Copilot
          </Button>

          {/* Port Scan Action (if IP/Host/Domain) */}
          {(object.type === 'IP' || object.type === 'DOMAIN' || object.type === 'HOST') && (
            <Button
              onClick={() => handleNavigate('/toolkit/ip-scanner', 'target')}
              variant="outline"
              className="h-8 text-xs font-mono border-slate-700 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/40"
            >
              <Globe className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              Scan IP Ports
            </Button>
          )}

          {/* IOC Analyzer Action */}
          <Button
            onClick={() => handleNavigate('/toolkit/ioc-analyzer', 'target')}
            variant="outline"
            className="h-8 text-xs font-mono border-slate-700 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/40"
          >
            <Search className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
            Deep IOC Reputation
          </Button>

          {/* DNS Analyzer (if Domain/IP) */}
          {(object.type === 'DOMAIN' || object.type === 'URL' || object.type === 'IP') && (
            <Button
              onClick={() => handleNavigate('/toolkit/dns-analyzer', 'domain')}
              variant="outline"
              className="h-8 text-xs font-mono border-slate-700 hover:bg-yellow-500/10 hover:text-yellow-300 hover:border-yellow-500/40"
            >
              <Terminal className="w-3.5 h-3.5 mr-1.5 text-yellow-400" />
              Analyze DNS Records
            </Button>
          )}

          {/* URL Analyzer (if URL/Domain) */}
          {(object.type === 'URL' || object.type === 'DOMAIN') && (
            <Button
              onClick={() => handleNavigate('/toolkit/url-analyzer', 'url')}
              variant="outline"
              className="h-8 text-xs font-mono border-slate-700 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/40"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Analyze URL Chain
            </Button>
          )}

          {/* CVE Explainer (if CVE) */}
          {object.type === 'CVE' && (
            <Button
              onClick={() => handleNavigate('/toolkit/cve-explainer', 'cve')}
              variant="outline"
              className="h-8 text-xs font-mono border-slate-700 hover:bg-orange-500/10 hover:text-orange-300 hover:border-orange-500/40"
            >
              <Shield className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
              Explain CVE & Affected Assets
            </Button>
          )}

          {/* Create Investigation */}
          <Button
            onClick={handleCreateInvestigation}
            disabled={investigationCreated}
            variant="outline"
            className="h-8 text-xs font-mono border-slate-700 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40"
          >
            {investigationCreated ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400 animate-bounce" />
                Case Created!
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1.5 text-red-400" />
                Create Investigation
              </>
            )}
          </Button>
        </div>
      </div>
    </CyberCard>
  );
}
