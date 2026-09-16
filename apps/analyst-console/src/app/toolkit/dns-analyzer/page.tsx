'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Globe, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Bot, 
  Server,
  Layers,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { CyberPageHeader, CyberCard, CyberMetric } from '../../../components/cybermind/CyberPrimitives';
import { CyberSeverityBadge, CyberStatusBadge } from '../../../components/cybermind/CyberBadges';
import { CyberCorrelationPanel } from '../../../components/cybermind/CyberCorrelationPanel';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { SecurityObject } from '../../../lib/toolkit/types';
import { saveToolkitHistoryItem } from '../../../lib/toolkit/store';

export default function DnsAnalyzerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialDomain = searchParams.get('domain') || 'cybermind.local';

  const [domainInput, setDomainInput] = useState(initialDomain);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dnsResult, setDnsResult] = useState<any | null>(null);

  useEffect(() => {
    if (initialDomain) {
      handleAnalyzeDns(initialDomain);
    }
  }, []);

  const handleAnalyzeDns = (domain: string) => {
    if (!domain) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      const res = {
        domain,
        records: [
          { type: 'A', name: domain, value: '185.220.101.5', ttl: 300, status: 'VALID' },
          { type: 'MX', name: domain, value: '10 mail.cybermind.local', ttl: 3600, status: 'VALID' },
          { type: 'NS', name: domain, value: 'ns1.cybermind-dns.net', ttl: 86400, status: 'VALID' },
          { type: 'NS', name: domain, value: 'ns2.cybermind-dns.net', ttl: 86400, status: 'VALID' },
          { type: 'TXT', name: domain, value: 'v=spf1 include:_spf.google.com ~all', ttl: 3600, status: 'VALID' },
          { type: 'TXT', name: '_dmarc.' + domain, value: 'v=DMARC1; p=reject; rua=mailto:dmarc@cybermind.local', ttl: 3600, status: 'PROTECTED' },
          { type: 'CAA', name: domain, value: '0 issue "letsencrypt.org"', ttl: 3600, status: 'VALID' },
        ],
        securityChecks: [
          { check: 'DMARC Policy Enforcement', status: 'PASS', detail: 'DMARC policy set to strict "reject"' },
          { check: 'SPF Mail Authentication', status: 'PASS', detail: 'SPF record syntax valid with Google include' },
          { check: 'DNSSEC Validation', status: 'WARNING', detail: 'DNSSEC RRSIG signatures missing on root zone' },
          { check: 'CAA Certificate Restriction', status: 'PASS', detail: 'Restricted to Let\'s Encrypt Certificate Authority' },
        ],
        infrastructureTree: {
          domain,
          ip: '185.220.101.5',
          asn: 'AS208294 (Cyberbunker Hosting)',
          infrastructure: 'Tor Exit Node / High Risk VPS',
        },
      };

      setDnsResult(res);
      setIsAnalyzing(false);

      saveToolkitHistoryItem({
        toolId: 'dns-analyzer',
        toolName: 'DNS Security Analyzer',
        target: domain,
        risk: 'INFO',
        summaryText: `Analyzed DNS for ${domain} — DMARC Reject Enforced, 7 Resource Records`,
        data: res,
      });
    }, 900);
  };

  const selectedSecurityObject: SecurityObject | null = dnsResult ? {
    id: `obj-dns-${dnsResult.domain}`,
    type: 'DOMAIN',
    value: dnsResult.domain,
    source: 'DNS Analyzer',
    timestamp: new Date().toISOString(),
    risk: 'INFO',
    confidence: 100,
    tags: ['dns', 'dmarc-reject', 'spf-valid', 'caa-enforced'],
    metadata: dnsResult,
  } : null;

  return (
    <div className="space-y-6">
      <CyberPageHeader
        title="DNS Security & Resource Record Analyzer"
        description="Comprehensive DNS record lookup (A, AAAA, MX, NS, TXT, CAA, DMARC) and mail security posture assessment."
        breadcrumbs={[
          { label: 'Security Toolkit', href: '/toolkit/ioc-analyzer' },
          { label: 'DNS Analyzer' },
        ]}
        badge={<CyberStatusBadge status="ACTIVE" />}
      />

      {/* Input */}
      <CyberCard className="p-5">
        <form onSubmit={(e) => { e.preventDefault(); handleAnalyzeDns(domainInput); }} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-slate-300">
              Target Domain Name
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="Enter domain (e.g. cybermind.local, example.com)..."
                  className="bg-slate-900 border-slate-800 font-mono text-xs text-slate-100 pr-10 h-10"
                />
                <Globe className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>

              <Button
                type="submit"
                disabled={isAnalyzing || !domainInput}
                className="h-10 px-6 font-mono text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Querying DNS...
                  </>
                ) : (
                  <>
                    <Terminal className="w-4 h-4 mr-2" />
                    Query Records
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CyberCard>

      {/* Results */}
      {dnsResult && !isAnalyzing && (
        <div className="space-y-6">
          {/* Header Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <CyberMetric
              title="Target Domain"
              value={dnsResult.domain}
              accentColor="cyan"
              icon={<Globe />}
            />
            <CyberMetric
              title="DMARC Protection"
              value="STRICT (reject)"
              subtitle="Anti-Spoofing Enforced"
              accentColor="emerald"
              icon={<CheckCircle2 />}
            />
            <CyberMetric
              title="SPF Record"
              value="VALID"
              subtitle="Google Include Syntax"
              accentColor="emerald"
              icon={<CheckCircle2 />}
            />
            <CyberMetric
              title="Resource Records"
              value={dnsResult.records.length}
              subtitle="A, MX, NS, TXT, CAA"
              accentColor="blue"
              icon={<Layers />}
            />
          </div>

          {/* Infrastructure Tree & Records */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Infrastructure Tree */}
            <CyberCard className="p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3">
                DNS Relationship & Infrastructure Graph
              </h3>

              <div className="p-4 rounded bg-slate-900/80 border border-slate-800 font-mono text-xs space-y-3">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>Domain: {dnsResult.infrastructureTree.domain}</span>
                </div>
                <div className="pl-6 border-l-2 border-slate-700 space-y-2">
                  <div className="text-slate-300">
                    &rarr; Resolved IP: <span className="text-cyan-400 font-bold">{dnsResult.infrastructureTree.ip}</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    &rarr; Autonomous System: {dnsResult.infrastructureTree.asn}
                  </div>
                  <div className="text-yellow-400 text-[11px]">
                    &rarr; Infrastructure Category: {dnsResult.infrastructureTree.infrastructure}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  <Button
                    onClick={() => router.push(`/toolkit/ip-scanner?target=${dnsResult.infrastructureTree.ip}`)}
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] font-mono border-slate-700 hover:bg-cyan-500/10 hover:text-cyan-300"
                  >
                    Scan Resolved IP Ports &rarr;
                  </Button>
                </div>
              </div>
            </CyberCard>

            {/* Security Checks */}
            <CyberCard className="p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3">
                Mail & Domain Security Posture Checks
              </h3>

              <div className="space-y-2 font-mono text-xs">
                {dnsResult.securityChecks.map((chk: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-200">{chk.check}</div>
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">{chk.detail}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      chk.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {chk.status}
                    </span>
                  </div>
                ))}
              </div>
            </CyberCard>
          </div>

          {/* DNS Resource Records Table */}
          <CyberCard className="p-5 space-y-4 overflow-hidden">
            <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3">
              Queried DNS Resource Records (RR)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Record Value</th>
                    <th className="py-2.5 px-3">TTL</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {dnsResult.records.map((rec: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-cyan-400">{rec.type}</td>
                      <td className="py-3 px-3 text-slate-300">{rec.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-100 max-w-md truncate" title={rec.value}>
                        {rec.value}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{rec.ttl}s</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CyberCard>

          {/* Shared Correlation Panel */}
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
