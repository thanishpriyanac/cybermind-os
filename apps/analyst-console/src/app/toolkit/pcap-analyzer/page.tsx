'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Server, 
  Upload, 
  Play, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Bot, 
  Search,
  FileCode,
  Layers,
  Globe
} from 'lucide-react';
import { CyberPageHeader, CyberCard, CyberMetric } from '../../../components/cybermind/CyberPrimitives';
import { CyberStatusBadge } from '../../../components/cybermind/CyberBadges';
import { CyberCorrelationPanel } from '../../../components/cybermind/CyberCorrelationPanel';
import { Button } from '../../../components/ui/button';
import { SecurityObject } from '../../../lib/toolkit/types';
import { saveToolkitHistoryItem } from '../../../lib/toolkit/store';

export default function PcapAnalyzerPage() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pcapResult, setPcapResult] = useState<any | null>({
    fileName: 'capture_suspicious_beacon.pcapng',
    fileSize: '4.2 MB',
    totalPackets: 18420,
    totalFlows: 312,
    uniqueIps: 14,
    uniqueDomains: 8,
    protocols: [
      { name: 'TCP', count: 14200, percent: '77%' },
      { name: 'UDP (DNS)', count: 3200, percent: '17%' },
      { name: 'HTTP (Cleartext)', count: 820, percent: '4.5%' },
      { name: 'ICMP', count: 200, percent: '1.5%' },
    ],
    securityIndicators: [
      { indicator: 'Port Scanning Pattern Detected', severity: 'HIGH', detail: 'Host 192.168.1.105 probed 1,000 TCP ports on 10.20.20.50 in 12 seconds' },
      { indicator: 'Cleartext HTTP Credentials Passed', severity: 'CRITICAL', detail: 'POST request to /login.php contained unencrypted form passwords' },
      { indicator: 'Suspicious DNS Beaconing', severity: 'MEDIUM', detail: 'Regular 30-second interval DNS queries to cdn-update-auth.com' },
    ],
    extractedIocs: [
      { type: 'IP', value: '185.220.101.5', count: 412 },
      { type: 'DOMAIN', value: 'cdn-update-auth.com', count: 88 },
      { type: 'URL', value: 'http://login.secure-auth-update-portal.com/auth/verify', count: 12 },
    ],
  });

  const handleAnalyzePcap = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      saveToolkitHistoryItem({
        toolId: 'pcap-analyzer',
        toolName: 'PCAP Analyzer',
        target: 'capture_suspicious_beacon.pcapng',
        risk: 'CRITICAL',
        summaryText: 'Analyzed PCAP file (18,420 packets) — Identified Port Scan & Cleartext HTTP Credentials',
        data: pcapResult,
      });
    }, 1100);
  };

  const selectedSecurityObject: SecurityObject | null = pcapResult ? {
    id: `obj-pcap-${Date.now()}`,
    type: 'IP',
    value: '185.220.101.5',
    source: 'PCAP Analyzer',
    timestamp: new Date().toISOString(),
    risk: 'CRITICAL',
    confidence: 100,
    tags: ['pcap', 'cleartext-creds', 'beaconing', 'port-scan'],
    metadata: pcapResult,
  } : null;

  return (
    <div className="space-y-6">
      <CyberPageHeader
        title="PCAP Network Traffic & Flow Analyzer"
        description="Deep packet inspection of .pcap and .pcapng captures for port scans, cleartext credentials, and DNS beaconing."
        breadcrumbs={[
          { label: 'Security Toolkit', href: '/toolkit/ioc-analyzer' },
          { label: 'PCAP Analyzer' },
        ]}
        badge={<CyberStatusBadge status="ACTIVE" />}
      />

      {/* File Upload Box */}
      <CyberCard className="p-8 text-center border-dashed border-slate-800 space-y-4">
        <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
          <Upload className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-mono font-bold text-slate-100">Upload Packet Capture File (.pcap / .pcapng)</h3>
          <p className="text-xs text-slate-400 font-mono mt-1">Drag and drop capture file or click to select sample network trace</p>
        </div>

        <div className="flex justify-center gap-3">
          <Button
            onClick={handleAnalyzePcap}
            disabled={isAnalyzing}
            className="h-9 px-6 font-mono text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
          >
            {isAnalyzing ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-spin" />
                Parsing PCAP Streams...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Analyze Sample PCAP
              </>
            )}
          </Button>
        </div>
      </CyberCard>

      {/* Results */}
      {pcapResult && !isAnalyzing && (
        <div className="space-y-6">
          {/* Packet Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <CyberMetric
              title="Total Packets Analyzed"
              value={pcapResult.totalPackets.toLocaleString()}
              subtitle={pcapResult.fileName}
              accentColor="cyan"
              icon={<Server />}
            />
            <CyberMetric
              title="Network Flows"
              value={pcapResult.totalFlows}
              subtitle="TCP/UDP Conversations"
              accentColor="blue"
              icon={<Layers />}
            />
            <CyberMetric
              title="Unique IP Endpoints"
              value={pcapResult.uniqueIps}
              subtitle="Sources & Destinations"
              accentColor="purple"
              icon={<Globe />}
            />
            <CyberMetric
              title="Security Threats"
              value={pcapResult.securityIndicators.length}
              subtitle="Critical Anomalies"
              accentColor="red"
              icon={<ShieldAlert />}
            />
          </div>

          {/* Protocol Distribution & Threat Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Security Indicators */}
            <CyberCard className="p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Detected Network Anomaly Indicators</span>
              </h3>

              <div className="space-y-2.5 font-mono text-xs">
                {pcapResult.securityIndicators.map((ind: any, idx: number) => (
                  <div key={idx} className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-100">{ind.indicator}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        ind.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {ind.severity}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">{ind.detail}</p>
                  </div>
                ))}
              </div>
            </CyberCard>

            {/* Extracted IOCs */}
            <CyberCard className="p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3">
                Extracted Network Indicators of Compromise (IOCs)
              </h3>

              <div className="space-y-2 font-mono text-xs">
                {pcapResult.extractedIocs.map((ioc: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">{ioc.type}</span>
                      <span className="text-cyan-300 font-bold">{ioc.value}</span>
                    </div>
                    <Button
                      onClick={() => router.push(`/toolkit/ioc-analyzer?target=${encodeURIComponent(ioc.value)}`)}
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] font-mono border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20"
                    >
                      Pivot &rarr;
                    </Button>
                  </div>
                ))}
              </div>
            </CyberCard>
          </div>

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
