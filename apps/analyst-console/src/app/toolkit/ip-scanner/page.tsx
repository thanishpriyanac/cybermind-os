'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Globe, 
  Play, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Shield, 
  Bot, 
  ExternalLink,
  Activity,
  FileText,
  Lock,
  Download
} from 'lucide-react';
import { CyberPageHeader, CyberCard, CyberMetric, CyberSkeleton } from '../../../components/cybermind/CyberPrimitives';
import { CyberSeverityBadge, CyberStatusBadge } from '../../../components/cybermind/CyberBadges';
import { CyberCorrelationPanel } from '../../../components/cybermind/CyberCorrelationPanel';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { SecurityObject } from '../../../lib/toolkit/types';
import { saveToolkitHistoryItem } from '../../../lib/toolkit/store';

interface ScannedPort {
  port: number;
  protocol: 'TCP' | 'UDP';
  state: 'OPEN' | 'CLOSED' | 'FILTERED';
  service: string;
  version: string;
  banner: string;
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  cvePotential?: string;
}

function IpPortScannerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTarget = searchParams.get('target') || '10.10.20.15';

  const [target, setTarget] = useState(initialTarget);
  const [scanType, setScanType] = useState<'quick' | 'standard' | 'custom'>('standard');
  const [portPreset, setPortPreset] = useState<'top20' | 'top100' | 'top1000' | 'custom'>('top100');
  const [customPorts, setCustomPorts] = useState('');
  const [protocol, setProtocol] = useState<'TCP' | 'UDP' | 'BOTH'>('TCP');
  const [authorized, setAuthorized] = useState(true);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    targetIp: string;
    hostname: string;
    scanTime: string;
    duration: string;
    ports: ScannedPort[];
  } | null>(null);

  useEffect(() => {
    if (initialTarget) {
      runScan(initialTarget);
    }
  }, []);

  const runScan = (scanTarget: string) => {
    if (!scanTarget) return;
    setIsScanning(true);

    setTimeout(() => {
      const mockPorts: ScannedPort[] = [
        { port: 22, protocol: 'TCP', state: 'OPEN', service: 'SSH', version: 'OpenSSH 8.2p1 Ubuntu-4ubuntu0.5', banner: 'SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5', risk: 'MEDIUM', cvePotential: 'CVE-2023-38408' },
        { port: 80, protocol: 'TCP', state: 'OPEN', service: 'HTTP', version: 'nginx 1.18.0', banner: 'HTTP/1.1 200 OK Server: nginx/1.18.0', risk: 'LOW' },
        { port: 443, protocol: 'TCP', state: 'OPEN', service: 'HTTPS', version: 'nginx 1.18.0 (TLS v1.3)', banner: 'HTTP/1.1 200 OK Server: nginx/1.18.0', risk: 'INFO' },
        { port: 3389, protocol: 'TCP', state: 'OPEN', service: 'RDP', version: 'Microsoft Remote Desktop Services', banner: 'RDP Protocol v10.4', risk: 'HIGH', cvePotential: 'CVE-2019-0708' },
        { port: 8080, protocol: 'TCP', state: 'OPEN', service: 'HTTP-ALT', version: 'Apache Tomcat 9.0.31', banner: 'Apache-Coyote/1.1', risk: 'CRITICAL', cvePotential: 'CVE-2020-1938' },
      ];

      const res = {
        targetIp: scanTarget.includes('.') ? scanTarget : '192.168.1.105',
        hostname: scanTarget.includes('.') ? `srv-${scanTarget.replace(/\./g, '-')}.internal.local` : scanTarget,
        scanTime: new Date().toLocaleTimeString(),
        duration: '1.42s',
        ports: mockPorts,
      };

      setScanResult(res);
      setIsScanning(false);

      saveToolkitHistoryItem({
        toolId: 'ip-scanner',
        toolName: 'IP Port Scanner',
        target: scanTarget,
        risk: 'HIGH',
        summaryText: `Discovered 5 open ports (${res.ports.filter(p => p.risk === 'CRITICAL' || p.risk === 'HIGH').length} high/critical risk)`,
        data: res,
      });
    }, 1200);
  };

  const currentSecurityObject: SecurityObject | null = scanResult ? {
    id: `obj-ip-${scanResult.targetIp}`,
    type: 'IP',
    value: scanResult.targetIp,
    source: 'IP Port Scanner',
    timestamp: new Date().toISOString(),
    risk: 'HIGH',
    confidence: 95,
    tags: ['port-scan', 'internal-asset', 'tomcat-vulnerable'],
    metadata: { hostname: scanResult.hostname, openPortsCount: scanResult.ports.length },
  } : null;

  return (
    <div className="space-y-6">
      <CyberPageHeader
        title="IP Port Scanner & Service Discovery"
        description="Active and passive port enumeration, service version fingerprinting, and automated vulnerability mapping."
        breadcrumbs={[
          { label: 'Security Toolkit', href: '/toolkit/ioc-analyzer' },
          { label: 'IP Port Scanner' },
        ]}
        badge={<CyberStatusBadge status="ACTIVE" />}
        actions={
          <Button
            onClick={() => scanResult && alert(JSON.stringify(scanResult, null, 2))}
            variant="outline"
            size="sm"
            className="h-8 text-xs font-mono border-slate-700"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export Scan Report
          </Button>
        }
      />

      {/* Mandatory Scope & Authorization Warning Box */}
      <div className="p-4 rounded-lg bg-yellow-950/20 border border-yellow-500/30 text-xs font-mono space-y-1.5">
        <div className="flex items-center gap-2 text-yellow-400 font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>AUTHORIZATION & SCOPE COMPLIANCE WARNING</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Port scanning creates network traffic and may trigger IDS/IPS alerts. Ensure you have explicit authorization to scan the target IP address or hostname. CyberMind automatically logs all scanning operations to the platform audit trail.
        </p>
      </div>

      {/* Input & Configuration Card */}
      <CyberCard className="p-5">
        <form onSubmit={(e) => { e.preventDefault(); runScan(target); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Target IP / Hostname / Domain
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. 10.10.20.15, internal-srv.local"
                  className="bg-slate-900 border-slate-800 font-mono text-xs text-slate-100 pr-10"
                />
                <Globe className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">Scan Profile</label>
              <select
                value={scanType}
                onChange={(e: any) => setScanType(e.target.value)}
                className="w-full h-9 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 px-3 focus:outline-none focus:border-cyan-500"
              >
                <option value="quick">Quick Scan (Top Ports)</option>
                <option value="standard">Standard Service Enum</option>
                <option value="custom">Deep Banner Grab</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">Protocol</label>
              <select
                value={protocol}
                onChange={(e: any) => setProtocol(e.target.value)}
                className="w-full h-9 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 px-3 focus:outline-none focus:border-cyan-500"
              >
                <option value="TCP">TCP SYN/Connect</option>
                <option value="UDP">UDP Probe</option>
                <option value="BOTH">TCP + UDP Combined</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <input
                type="checkbox"
                id="auth-check"
                checked={authorized}
                onChange={(e) => setAuthorized(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="auth-check">I confirm target is within authorized SOC scope</label>
            </div>

            <Button
              type="submit"
              disabled={isScanning || !authorized || !target}
              className="h-9 font-mono text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
            >
              {isScanning ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin text-white" />
                  Scanning Ports...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Execute Port Scan
                </>
              )}
            </Button>
          </div>
        </form>
      </CyberCard>

      {/* Results Section */}
      {isScanning && (
        <CyberCard className="p-8 text-center space-y-3">
          <Activity className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <div className="text-sm font-mono font-bold text-slate-200">
            Probe Packets Sent to {target}...
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Fingerprinting TCP services and matching version strings against known CVE database...
          </p>
        </CyberCard>
      )}

      {scanResult && !isScanning && (
        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <CyberMetric
              title="Target IP"
              value={scanResult.targetIp}
              subtitle={scanResult.hostname}
              accentColor="cyan"
              icon={<Globe />}
            />
            <CyberMetric
              title="Open Ports Found"
              value={scanResult.ports.filter(p => p.state === 'OPEN').length}
              subtitle="Services Fingerprinted"
              accentColor="blue"
              icon={<CheckCircle2 />}
            />
            <CyberMetric
              title="High Risk Services"
              value={scanResult.ports.filter(p => p.risk === 'CRITICAL' || p.risk === 'HIGH').length}
              subtitle="Require Remediation"
              accentColor="red"
              icon={<ShieldAlert />}
            />
            <CyberMetric
              title="Execution Time"
              value={scanResult.duration}
              subtitle={`Completed at ${scanResult.scanTime}`}
              accentColor="slate"
              icon={<Clock />}
            />
          </div>

          {/* Discovered Ports Table */}
          <CyberCard className="p-5 overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
                <span>Discovered Services & Version Banners</span>
                <span className="text-xs font-normal text-slate-400">({scanResult.ports.length} total)</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Port</th>
                    <th className="py-2.5 px-3">Proto</th>
                    <th className="py-2.5 px-3">State</th>
                    <th className="py-2.5 px-3">Service</th>
                    <th className="py-2.5 px-3">Version / Banner</th>
                    <th className="py-2.5 px-3">Risk</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {scanResult.ports.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-cyan-400">{p.port}</td>
                      <td className="py-3 px-3 text-slate-300">{p.protocol}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {p.state}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-200">{p.service}</td>
                      <td className="py-3 px-3 text-slate-300 max-w-xs truncate" title={p.banner}>
                        {p.version}
                        {p.cvePotential && (
                          <div className="text-[10px] text-orange-400 font-bold mt-0.5 flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            <span>Matched: {p.cvePotential}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <CyberSeverityBadge severity={p.risk} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.cvePotential ? (
                            <Button
                              onClick={() => router.push(`/toolkit/cve-explainer?cve=${p.cvePotential}`)}
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] font-mono border-orange-500/40 text-orange-300 hover:bg-orange-500/20"
                            >
                              Explain CVE
                            </Button>
                          ) : (
                            <Button
                              onClick={() => router.push(`/cve?search=${encodeURIComponent(p.service)}`)}
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] font-mono border-slate-700 hover:bg-slate-800"
                            >
                              Search CVEs
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CyberCard>

          {/* Shared Correlation Engine Component */}
          {currentSecurityObject && (
            <CyberCorrelationPanel
              object={currentSecurityObject}
              onAskCyberAI={(prompt) => router.push(`/copilot?prompt=${encodeURIComponent(prompt)}`)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function IpPortScannerPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs font-mono text-cyan-400">Loading Port Scanner...</div>}>
      <IpPortScannerContent />
    </Suspense>
  );
}
