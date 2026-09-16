'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  HeartPulse, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Bot, 
  Clock,
  Server
} from 'lucide-react';
import { CyberPageHeader, CyberCard, CyberMetric } from '../../../components/cybermind/CyberPrimitives';
import { CyberStatusBadge } from '../../../components/cybermind/CyberBadges';
import { CyberCorrelationPanel } from '../../../components/cybermind/CyberCorrelationPanel';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { SecurityObject } from '../../../lib/toolkit/types';
import { saveToolkitHistoryItem } from '../../../lib/toolkit/store';

export default function ConnectivityTesterPage() {
  const router = useRouter();
  const [target, setTarget] = useState('10.20.20.50');
  const [port, setPort] = useState('443');
  const [protocol, setProtocol] = useState('HTTPS');

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>({
    target: '10.20.20.50',
    port: '443',
    protocol: 'HTTPS',
    overallStatus: 'FAIL (Application Layer Error)',
    stages: [
      { stage: 'DNS Resolution', status: 'PASS', detail: 'Resolved to 10.20.20.50', latency: '1.2ms' },
      { stage: 'ICMP Echo Ping', status: 'PASS', detail: '0% packet loss (4/4 packets returned)', latency: '4.8ms' },
      { stage: 'TCP Connection (Port 443)', status: 'PASS', detail: 'SYN/ACK 3-way handshake established', latency: '8.4ms' },
      { stage: 'TLS Handshake (TLS v1.3)', status: 'PASS', detail: 'Certificate chain valid (Let\'s Encrypt)', latency: '18.2ms' },
      { stage: 'HTTP GET / Application Request', status: 'FAIL', detail: 'HTTP 503 Service Unavailable (Web Server Pool Exhausted)', latency: '42.1ms' },
    ],
    conclusion: 'Network connectivity and firewall rules are fully functional (TCP 443 reachability verified), but the web application backend returned an HTTP 503 error.',
  });

  const handleRunTest = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      saveToolkitHistoryItem({
        toolId: 'connectivity-tester',
        toolName: 'Connectivity Tester',
        target: `${target}:${port}`,
        risk: 'MEDIUM',
        summaryText: `Diagnosed ${target}:${port} — Network PASS, Application Layer HTTP 503 FAIL`,
        data: testResult,
      });
    }, 850);
  };

  const selectedSecurityObject: SecurityObject | null = testResult ? {
    id: `obj-conn-${testResult.target}`,
    type: 'HOST',
    value: testResult.target,
    source: 'Connectivity Tester',
    timestamp: new Date().toISOString(),
    risk: 'MEDIUM',
    confidence: 100,
    tags: ['network-connectivity', 'http-503', 'tcp-pass'],
    metadata: testResult,
  } : null;

  return (
    <div className="space-y-6">
      <CyberPageHeader
        title="Multi-Layer Network & Application Connectivity Tester"
        description="Stage-by-stage diagnostic testing: DNS Resolution, ICMP Ping, TCP Handshake, TLS Negotiation, and HTTP Application Layer."
        breadcrumbs={[
          { label: 'Security Toolkit', href: '/toolkit/ioc-analyzer' },
          { label: 'Connectivity Tester' },
        ]}
        badge={<CyberStatusBadge status="ACTIVE" />}
      />

      {/* Input */}
      <CyberCard className="p-5">
        <form onSubmit={(e) => { e.preventDefault(); handleRunTest(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Target Hostname / IP</label>
              <Input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="bg-slate-900 border-slate-800 font-mono text-xs text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Destination Port</label>
              <Input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="bg-slate-900 border-slate-800 font-mono text-xs text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Protocol</label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="w-full h-9 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 px-3"
              >
                <option value="HTTPS">HTTPS (TLS 443)</option>
                <option value="HTTP">HTTP (80)</option>
                <option value="TCP">Raw TCP Socket</option>
                <option value="ICMP">ICMP Ping Only</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <Button
              type="submit"
              disabled={isTesting}
              className="h-9 px-6 font-mono text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
            >
              {isTesting ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Testing Connectivity...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Execute Diagnostic Test
                </>
              )}
            </Button>
          </div>
        </form>
      </CyberCard>

      {/* Results */}
      {testResult && !isTesting && (
        <div className="space-y-6">
          {/* Stage Progression Cards */}
          <CyberCard className="p-5 space-y-4">
            <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>OSI Protocol Layer Diagnostic Pipeline</span>
              <span className="text-xs font-bold text-red-400 font-mono">{testResult.overallStatus}</span>
            </h3>

            <div className="space-y-2.5 font-mono text-xs">
              {testResult.stages.map((stg: any, idx: number) => (
                <div key={idx} className={`p-3 rounded border flex items-center justify-between ${
                  stg.status === 'PASS' 
                    ? 'bg-slate-900/80 border-slate-800' 
                    : 'bg-red-950/20 border-red-500/40 text-red-300 font-bold'
                }`}>
                  <div className="flex items-center gap-3">
                    {stg.status === 'PASS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-slate-200">{stg.stage}</div>
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">{stg.detail}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      stg.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {stg.status}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">{stg.latency}</div>
                  </div>
                </div>
              ))}
            </div>
          </CyberCard>

          {/* Diagnostic Conclusion */}
          <CyberCard className="p-5 space-y-2 bg-slate-950 border-slate-800">
            <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-cyan-400" />
              <span>Automated Diagnostic Conclusion</span>
            </h3>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              {testResult.conclusion}
            </p>
          </CyberCard>

          {/* Correlation Engine */}
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
