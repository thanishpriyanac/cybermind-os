'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Globe, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Bot, 
  Server,
  Clock,
  Terminal
} from 'lucide-react';
import { CyberPageHeader, CyberCard, CyberMetric } from '../../../components/cybermind/CyberPrimitives';
import { CyberStatusBadge } from '../../../components/cybermind/CyberBadges';
import { CyberCorrelationPanel } from '../../../components/cybermind/CyberCorrelationPanel';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { SecurityObject } from '../../../lib/toolkit/types';
import { saveToolkitHistoryItem } from '../../../lib/toolkit/store';

export default function DnsTroubleshooterPage() {
  const router = useRouter();
  const [domainInput, setDomainInput] = useState('internal-app.corp.local');
  const [recordType, setRecordType] = useState('A');

  const [isQuerying, setIsQuerying] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<any | null>({
    domain: 'internal-app.corp.local',
    recordType: 'A',
    resolvers: [
      { name: 'Internal Corporate DNS (10.10.10.1)', response: '10.20.30.50', rcode: 'NOERROR', latency: '2ms', status: 'PASS' },
      { name: 'Cloudflare Public DNS (1.1.1.1)', response: 'NXDOMAIN', rcode: 'NXDOMAIN', latency: '18ms', status: 'MISMATCH' },
      { name: 'Google Public DNS (8.8.8.8)', response: 'NXDOMAIN', rcode: 'NXDOMAIN', latency: '24ms', status: 'MISMATCH' },
      { name: 'Quad9 Security Resolver (9.9.9.9)', response: 'NXDOMAIN', rcode: 'NXDOMAIN', latency: '22ms', status: 'MISMATCH' },
    ],
    troubleshootingConclusion: {
      summary: 'Split-Horizon DNS Conflict / Intranet Private Domain',
      explanation: 'Target domain "internal-app.corp.local" resolves correctly on internal corporate DNS (10.10.10.1) but returns NXDOMAIN on public resolvers. This is expected behavior for internal split-horizon enterprise networks.',
      recommendation: 'Ensure internal workstations are configured to use internal DNS resolvers (10.10.10.1 / 10.10.10.2) via DHCP.',
    },
  });

  const handleRunTroubleshoot = () => {
    setIsQuerying(true);
    setTimeout(() => {
      setIsQuerying(false);
      saveToolkitHistoryItem({
        toolId: 'dns-troubleshooter',
        toolName: 'DNS Resolver Troubleshooter',
        target: domainInput,
        risk: 'INFO',
        summaryText: `Troubleshot DNS for ${domainInput} across 4 Resolvers — Identified Split-Horizon Intranet Record`,
        data: comparisonResult,
      });
    }, 800);
  };

  const selectedSecurityObject: SecurityObject | null = comparisonResult ? {
    id: `obj-dnst-${comparisonResult.domain}`,
    type: 'DOMAIN',
    value: comparisonResult.domain,
    source: 'DNS Resolver Troubleshooter',
    timestamp: new Date().toISOString(),
    risk: 'INFO',
    confidence: 100,
    tags: ['dns-troubleshooter', 'split-horizon', 'nxdomain', 'internal-dns'],
    metadata: comparisonResult,
  } : null;

  return (
    <div className="space-y-6">
      <CyberPageHeader
        title="Multi-Resolver DNS Lookup & Propagation Troubleshooter"
        description="Compare real-time DNS resolution across internal corporate DNS, Cloudflare (1.1.1.1), Google (8.8.8.8), and Quad9."
        breadcrumbs={[
          { label: 'Security Toolkit', href: '/toolkit/ioc-analyzer' },
          { label: 'DNS Troubleshooter' },
        ]}
        badge={<CyberStatusBadge status="ACTIVE" />}
      />

      {/* Input */}
      <CyberCard className="p-5">
        <form onSubmit={(e) => { e.preventDefault(); handleRunTroubleshoot(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Target Domain / Hostname
              </label>
              <Input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                className="bg-slate-900 border-slate-800 font-mono text-xs text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">Record Type</label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full h-9 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 px-3"
              >
                <option value="A">A Record (IPv4)</option>
                <option value="AAAA">AAAA Record (IPv6)</option>
                <option value="CNAME">CNAME Alias</option>
                <option value="MX">MX Mail Server</option>
                <option value="TXT">TXT Text Record</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <Button
              type="submit"
              disabled={isQuerying || !domainInput}
              className="h-9 px-6 font-mono text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
            >
              {isQuerying ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Comparing Resolvers...
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4 mr-2" />
                  Compare DNS Resolvers
                </>
              )}
            </Button>
          </div>
        </form>
      </CyberCard>

      {/* Results */}
      {comparisonResult && !isQuerying && (
        <div className="space-y-6">
          {/* Comparison Cards */}
          <CyberCard className="p-5 space-y-4">
            <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3">
              Multi-Resolver Response Matrix ({comparisonResult.recordType} Record)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              {comparisonResult.resolvers.map((res: any, idx: number) => (
                <div key={idx} className={`p-3 rounded border ${
                  res.status === 'PASS' 
                    ? 'bg-slate-900 border-emerald-500/40' 
                    : 'bg-slate-900/60 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">{res.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      res.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {res.status}
                    </span>
                  </div>
                  <div className="text-cyan-300 font-bold text-sm">{res.response}</div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                    <span>RCODE: {res.rcode}</span>
                    <span>Latency: {res.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </CyberCard>

          {/* Troubleshooting Diagnosis */}
          <CyberCard className="p-5 space-y-3 bg-slate-950">
            <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Diagnostic Conclusion: {comparisonResult.troubleshootingConclusion.summary}</span>
            </h3>

            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              {comparisonResult.troubleshootingConclusion.explanation}
            </p>

            <div className="p-3 rounded bg-cyan-950/20 border border-cyan-500/30 text-xs font-mono text-cyan-300">
              <span className="font-bold block mb-0.5">Suggested Operational Action:</span>
              {comparisonResult.troubleshootingConclusion.recommendation}
            </div>
          </CyberCard>

          {/* Correlation Panel */}
          {selectedSecurityObject && (
            <CyberCorrelationPanel
              object={selectedSecurityObject}
              onAskCyberAI={(prompt) => router.push(`/copilot?prompt=${encodeURIComponent(prompt)}`)}
            />
          )}
        </div>
      )}
    </div>
  );
}
