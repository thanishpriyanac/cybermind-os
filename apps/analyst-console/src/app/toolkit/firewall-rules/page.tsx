'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Server, 
  FileCode, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Bot, 
  Play, 
  Plus, 
  Download,
  Filter,
  FileText
} from 'lucide-react';
import { CyberPageHeader, CyberCard, CyberMetric } from '../../../components/cybermind/CyberPrimitives';
import { CyberSeverityBadge, CyberStatusBadge } from '../../../components/cybermind/CyberBadges';
import { CyberCorrelationPanel } from '../../../components/cybermind/CyberCorrelationPanel';
import { Button } from '../../../components/ui/button';
import { SecurityObject } from '../../../lib/toolkit/types';
import { saveToolkitHistoryItem } from '../../../lib/toolkit/store';

interface FirewallRuleItem {
  ruleId: string;
  name: string;
  source: string;
  destination: string;
  service: string;
  action: 'ACCEPT' | 'DENY';
  nat: string;
  logging: 'ENABLED' | 'DISABLED';
  securityProfiles: string;
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
  recommendation: string;
}

export default function FirewallRuleAnalyzerPage() {
  const router = useRouter();
  const [rawConfig, setRawConfig] = useState(`config firewall policy
    edit 42
        set name "Allow-All-Inbound"
        set srcintf "wan1"
        set dstintf "internal"
        set srcaddr "all"
        set dstaddr "all"
        set action accept
        set schedule "always"
        set service "ALL"
        set logtraffic disable
    next
    edit 17
        set name "DMZ-Web-Publish"
        set srcintf "wan1"
        set dstintf "dmz"
        set srcaddr "all"
        set dstaddr "10.20.20.50"
        set action accept
        set service "HTTPS"
        set logtraffic utm
        set utm-status enable
        set av-profile "default"
        set ips-sensor "default"
    next
end`);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedRules, setAnalyzedRules] = useState<FirewallRuleItem[] | null>([
    {
      ruleId: 'Policy #42',
      name: 'Allow-All-Inbound',
      source: 'wan1 (all)',
      destination: 'internal (all)',
      service: 'ALL',
      action: 'ACCEPT',
      nat: 'Disabled',
      logging: 'DISABLED',
      securityProfiles: 'None (Unprotected)',
      risk: 'CRITICAL',
      reasons: [
        'Unrestricted Source (all)',
        'Unrestricted Destination (all)',
        'Unrestricted Service (ALL)',
        'Disabled Log Traffic',
        'WAN to Internal direct exposure',
      ],
      recommendation: 'Disable policy immediately or restrict source IP range, target server IP, and specific destination ports.',
    },
    {
      ruleId: 'Policy #17',
      name: 'DMZ-Web-Publish',
      source: 'wan1 (all)',
      destination: 'dmz (10.20.20.50)',
      service: 'HTTPS (TCP 443)',
      action: 'ACCEPT',
      nat: 'Disabled',
      logging: 'ENABLED',
      securityProfiles: 'AV (default), IPS (default)',
      risk: 'LOW',
      reasons: ['Internet facing HTTP service (Standard DMZ exposure)'],
      recommendation: 'Ensure IPS sensor rules are updated daily.',
    },
  ]);

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      saveToolkitHistoryItem({
        toolId: 'firewall-rules',
        toolName: 'Firewall Rule Analyzer',
        target: 'FortiOS Import Config',
        risk: 'CRITICAL',
        summaryText: 'Audited FortiGate configuration — Found 1 CRITICAL Policy (#42 Any-to-Any)',
        data: analyzedRules,
      });
    }, 1000);
  };

  const selectedRuleObject: SecurityObject | null = analyzedRules ? {
    id: `obj-fw-${analyzedRules[0].ruleId}`,
    type: 'FIREWALL_RULE',
    value: analyzedRules[0].ruleId,
    source: 'Firewall Rule Analyzer',
    timestamp: new Date().toISOString(),
    risk: 'CRITICAL',
    confidence: 100,
    tags: ['fortigate', 'any-to-any', 'disabled-logging', 'wan-exposure'],
    metadata: analyzedRules[0],
  } : null;

  return (
    <div className="space-y-6">
      <CyberPageHeader
        title="Firewall Rule & Security Policy Audit Analyzer"
        description="Audit FortiGate & enterprise firewall configurations for risky any-to-any policies, unlogged rules, and WAN exposures."
        breadcrumbs={[
          { label: 'Security Toolkit', href: '/toolkit/ioc-analyzer' },
          { label: 'Firewall Rule Analyzer' },
        ]}
        badge={<CyberStatusBadge status="HEALTHY" />}
      />

      {/* Input Config Area */}
      <CyberCard className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-medium text-slate-300 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>Paste FortiGate CLI / Firewall Policy Configuration</span>
          </label>
          <span className="text-xs font-mono text-slate-400">Format: FortiOS CLI / JSON / Structured Text</span>
        </div>

        <textarea
          value={rawConfig}
          onChange={(e) => setRawConfig(e.target.value)}
          rows={6}
          className="w-full p-3 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
        />

        <div className="flex justify-end">
          <Button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || !rawConfig}
            className="h-9 px-6 font-mono text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
          >
            <Play className="w-4 h-4 mr-2" />
            Analyze Firewall Rules
          </Button>
        </div>
      </CyberCard>

      {/* Results */}
      {analyzedRules && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <CyberMetric
              title="Total Rules Audited"
              value={analyzedRules.length}
              accentColor="cyan"
              icon={<Server />}
            />
            <CyberMetric
              title="Critical Risky Rules"
              value={analyzedRules.filter(r => r.risk === 'CRITICAL').length}
              subtitle="Any-to-Any Exposure"
              accentColor="red"
              icon={<ShieldAlert />}
            />
            <CyberMetric
              title="Disabled Logging"
              value={analyzedRules.filter(r => r.logging === 'DISABLED').length}
              subtitle="No Audit Trail"
              accentColor="orange"
              icon={<AlertTriangle />}
            />
            <CyberMetric
              title="Missing Security Profiles"
              value={analyzedRules.filter(r => r.securityProfiles.includes('None')).length}
              subtitle="No AV/IPS Enforcement"
              accentColor="yellow"
              icon={<CheckCircle2 />}
            />
          </div>

          {/* Rule Findings Table */}
          <CyberCard className="p-5 space-y-4 overflow-hidden">
            <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3">
              Audited Firewall Rules & Vulnerability Findings
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Rule ID / Name</th>
                    <th className="py-2.5 px-3">Source &rarr; Dest</th>
                    <th className="py-2.5 px-3">Service</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Logging</th>
                    <th className="py-2.5 px-3">Risk Level</th>
                    <th className="py-2.5 px-3">Risk Reasons & Recommendation</th>
                    <th className="py-2.5 px-3 text-right">Pivot Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {analyzedRules.map((rule, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-cyan-400">{rule.ruleId}</div>
                        <div className="text-[11px] text-slate-400">{rule.name}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-200">{rule.source}</div>
                        <div className="text-slate-400 text-[11px]">&rarr; {rule.destination}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-300">{rule.service}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rule.action === 'ACCEPT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {rule.action}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          rule.logging === 'DISABLED' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {rule.logging}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <CyberSeverityBadge severity={rule.risk} />
                      </td>
                      <td className="py-3 px-3 max-w-sm space-y-1">
                        <div className="text-red-400 font-semibold">{rule.reasons.join('; ')}</div>
                        <div className="text-slate-400 text-[11px] font-sans">{rule.recommendation}</div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            onClick={() => router.push(`/toolkit/firewall-simulator?src=10.10.10.20&dst=10.20.20.50&port=443`)}
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] font-mono border-slate-700 hover:bg-slate-800"
                          >
                            Simulate Traffic
                          </Button>
                          <Button
                            onClick={() => router.push(`/copilot?prompt=${encodeURIComponent(`Explain why Firewall Rule ${rule.ruleId} (${rule.name}) is risky and how to remediate it.`)}`)}
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] font-mono border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20"
                          >
                            Explain
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CyberCard>

          {/* Correlation Engine Panel */}
          {selectedRuleObject && (
            <CyberCorrelationPanel
              object={selectedRuleObject}
              onAskCyberAI={(prompt) => router.push(`/copilot?prompt=${encodeURIComponent(prompt)}`)}
            />
          )}
        </div>
      )}
    </div>
  );
}
