'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, 
  Activity, 
  Globe, 
  ShieldAlert, 
  FileText, 
  Lock, 
  CheckCircle2, 
  ExternalLink,
  Bot,
  Plus,
  Copy,
  Download,
  AlertTriangle,
  Server
} from 'lucide-react';
import { CyberPageHeader, CyberCard, CyberMetric } from '../../../components/cybermind/CyberPrimitives';
import { CyberSeverityBadge, CyberStatusBadge } from '../../../components/cybermind/CyberBadges';
import { CyberCorrelationPanel } from '../../../components/cybermind/CyberCorrelationPanel';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { SecurityObject, SecurityObjectType } from '../../../lib/toolkit/types';
import { saveToolkitHistoryItem } from '../../../lib/toolkit/store';

function IocAnalyzerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTarget = searchParams.get('target') || '185.220.101.5';

  const [inputVal, setInputVal] = useState(initialTarget);
  const [detectedType, setDetectedType] = useState<SecurityObjectType>('IP');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const detectIocType = (val: string): SecurityObjectType => {
    const trimmed = val.trim();
    if (!trimmed) return 'IOC';

    if (/^[a-fA-F0-9]{32}$/.test(trimmed) || /^[a-fA-F0-9]{40}$/.test(trimmed) || /^[a-fA-F0-9]{64}$/.test(trimmed)) {
      return 'HASH';
    }
    if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(trimmed) || /^[0-9a-fA-F:]+$/.test(trimmed) && trimmed.includes(':')) {
      return 'IP';
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return 'URL';
    }
    if (trimmed.includes('@') && trimmed.includes('.')) {
      return 'USER';
    }
    if (trimmed.includes('.')) {
      return 'DOMAIN';
    }
    return 'HOST';
  };

  const handleInputChange = (val: string) => {
    setInputVal(val);
    setDetectedType(detectIocType(val));
  };

  useEffect(() => {
    if (initialTarget) {
      handleAnalyze(initialTarget);
    }
  }, []);

  const handleAnalyze = (target: string) => {
    if (!target) return;
    setIsAnalyzing(true);
    const iocType = detectIocType(target);
    setDetectedType(iocType);

    setTimeout(() => {
      let data: any = {};
      if (iocType === 'IP') {
        data = {
          ioc: target,
          type: 'IP',
          reputationScore: 88,
          threatClassification: 'MALICIOUS',
          geoip: 'Frankfurt, Hesse, Germany (DE)',
          asn: 'AS208294 Tor Exit Node Node-Network',
          isp: 'Cyberbunker Hosting Services',
          firstSeen: '2026-02-14 08:32:00',
          lastSeen: '2026-09-16 19:12:40',
          abuseReportsCount: 412,
          relatedDomains: ['dark-command-node.ru', 'cdn-update-auth.com', 'login-verify-portal.net'],
          relatedInfrastructure: ['185.220.101.6', '185.220.101.12'],
          cybermindAlerts: 4,
          cybermindInvestigations: 1,
        };
      } else if (iocType === 'HASH') {
        data = {
          ioc: target,
          type: 'HASH',
          hashType: target.length === 64 ? 'SHA-256' : 'MD5',
          fileNames: ['payload_installer.exe', 'svc_update.bin'],
          malwareFamily: 'Cobalt Strike Beacon / AsyncRAT',
          detectionRatio: '58 / 72 (Security Vendors)',
          threatClassification: 'CRITICAL',
          firstSeen: '2026-08-01',
          lastSeen: '2026-09-15',
          relatedDomains: ['cnc-beacon.org'],
          relatedIPs: ['194.26.29.112'],
        };
      } else if (iocType === 'DOMAIN' || iocType === 'URL') {
        data = {
          ioc: target,
          type: iocType,
          reputationScore: 92,
          threatClassification: 'HIGH',
          resolvedIp: '185.220.101.5',
          registrar: 'NameCheap Inc.',
          creationDate: '2026-08-20 (Recent)',
          sslIssuer: 'Let\'s Encrypt Authority X3',
          sslStatus: 'Valid (Suspicious Short TTL)',
          threatCategories: ['Phishing', 'Command and Control', 'Credential Harvesting'],
          relatedUrls: [`http://${target}/login.php`, `http://${target}/admin/payload.bin`],
        };
      } else {
        data = {
          ioc: target,
          type: iocType,
          reputationScore: 45,
          threatClassification: 'MEDIUM',
          details: 'Suspicious hostname activity observed in internal VPN log streams.',
        };
      }

      setAnalysisResult(data);
      setIsAnalyzing(false);

      saveToolkitHistoryItem({
        toolId: 'ioc-analyzer',
        toolName: 'IOC Analyzer',
        target,
        risk: data.threatClassification || 'HIGH',
        summaryText: `Analyzed ${iocType} ${target} — Reputation Score: ${data.reputationScore || 85}/100`,
        data,
      });
    }, 1000);
  };

  const currentSecurityObject: SecurityObject | null = analysisResult ? {
    id: `obj-ioc-${analysisResult.ioc}`,
    type: detectedType,
    value: analysisResult.ioc,
    source: 'IOC Analyzer',
    timestamp: new Date().toISOString(),
    risk: analysisResult.threatClassification || 'HIGH',
    confidence: 90,
    tags: [detectedType.toLowerCase(), 'threat-intel', 'ioc-analysis'],
    metadata: analysisResult,
  } : null;

  return (
    <div className="space-y-6">
      <CyberPageHeader
        title="Central IOC Threat Intelligence Analyzer"
        description="Unified indicator analysis across IPs, Hashes, Domains, URLs, Hostnames, and Emails with correlation."
        breadcrumbs={[
          { label: 'Security Toolkit', href: '/toolkit/ioc-analyzer' },
          { label: 'IOC Analyzer' },
        ]}
        badge={<CyberStatusBadge status="HEALTHY" />}
      />

      {/* Input Section */}
      <CyberCard className="p-5">
        <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(inputVal); }} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-medium text-slate-300">
                Enter Indicator of Compromise (IOC)
              </label>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                Auto-Detected Type: <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">{detectedType}</span>
              </span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  value={inputVal}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Paste IP (185.220.101.5), Hash (d41d8cd98f00b204e9800998ecf8427e), Domain, URL, or Email..."
                  className="bg-slate-900 border-slate-800 font-mono text-xs text-slate-100 pr-10 h-10"
                />
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>

              <Button
                type="submit"
                disabled={isAnalyzing || !inputVal}
                className="h-10 px-6 font-mono text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Querying Intel...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Analyze IOC
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CyberCard>

      {/* Analysis Results */}
      {isAnalyzing && (
        <CyberCard className="p-8 text-center space-y-3">
          <Activity className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <div className="text-sm font-mono font-bold text-slate-200">
            Cross-Referencing IOC &quot;{inputVal}&quot; across CyberMind Threat Feeds...
          </div>
        </CyberCard>
      )}

      {analysisResult && !isAnalyzing && (
        <div className="space-y-6">
          {/* Key Metrics Header */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <CyberMetric
              title="Target Indicator"
              value={analysisResult.ioc}
              subtitle={`Type: ${analysisResult.type}`}
              accentColor="cyan"
              icon={<Search />}
            />
            <CyberMetric
              title="Risk Classification"
              value={analysisResult.threatClassification}
              accentColor={analysisResult.threatClassification === 'CRITICAL' || analysisResult.threatClassification === 'MALICIOUS' ? 'red' : 'orange'}
              icon={<ShieldAlert />}
            />
            <CyberMetric
              title="Reputation Score"
              value={analysisResult.reputationScore ? `${analysisResult.reputationScore}/100` : 'N/A'}
              subtitle="High Risk Confidence"
              accentColor="red"
              icon={<Activity />}
            />
            <CyberMetric
              title="Observation Status"
              value="ACTIVE THREAT"
              subtitle={`Last Seen: ${analysisResult.lastSeen}`}
              accentColor="yellow"
              icon={<CheckCircle2 />}
            />
          </div>

          {/* Type-Specific Detailed Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Intel Details Card */}
            <CyberCard className="p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center justify-between border-b border-slate-800 pb-3">
                <span>Threat Intelligence Attributes</span>
                <CyberSeverityBadge severity={analysisResult.threatClassification} />
              </h3>

              <div className="space-y-2.5 font-mono text-xs">
                {analysisResult.type === 'IP' && (
                  <>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">GeoIP Location:</span>
                      <span className="text-slate-200 font-semibold">{analysisResult.geoip}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Autonomous System (ASN):</span>
                      <span className="text-slate-200 font-semibold">{analysisResult.asn}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">ISP Provider:</span>
                      <span className="text-slate-200 font-semibold">{analysisResult.isp}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Global Abuse Reports:</span>
                      <span className="text-red-400 font-bold">{analysisResult.abuseReportsCount} reports</span>
                    </div>
                  </>
                )}

                {analysisResult.type === 'HASH' && (
                  <>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Hash Type:</span>
                      <span className="text-cyan-400 font-bold">{analysisResult.hashType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Malware Family:</span>
                      <span className="text-red-400 font-bold">{analysisResult.malwareFamily}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">AV Vendor Detections:</span>
                      <span className="text-red-300 font-semibold">{analysisResult.detectionRatio}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Sample File Names:</span>
                      <span className="text-slate-200">{analysisResult.fileNames?.join(', ')}</span>
                    </div>
                  </>
                )}

                {(analysisResult.type === 'DOMAIN' || analysisResult.type === 'URL') && (
                  <>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Resolved IP Address:</span>
                      <span className="text-cyan-400 font-bold">{analysisResult.resolvedIp}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Registrar Info:</span>
                      <span className="text-slate-200">{analysisResult.registrar}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">SSL Certificate Status:</span>
                      <span className="text-yellow-400 font-semibold">{analysisResult.sslStatus}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-400">Threat Categories:</span>
                      <span className="text-red-400 font-semibold">{analysisResult.threatCategories?.join(', ')}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">First Observed:</span>
                  <span className="text-slate-300">{analysisResult.firstSeen}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/40">
                  <span className="text-slate-400">Last Active Timestamp:</span>
                  <span className="text-slate-300">{analysisResult.lastSeen}</span>
                </div>
              </div>
            </CyberCard>

            {/* Related Indicators Card */}
            <CyberCard className="p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3">
                Associated Infrastructure & Pivots
              </h3>

              <div className="space-y-3 font-mono text-xs">
                {analysisResult.relatedDomains && (
                  <div>
                    <div className="text-slate-400 font-semibold mb-1">Related Domains:</div>
                    <div className="space-y-1">
                      {analysisResult.relatedDomains.map((d: string, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-cyan-300 font-semibold">{d}</span>
                          <Button
                            onClick={() => router.push(`/toolkit/dns-analyzer?domain=${d}`)}
                            variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-cyan-400 hover:bg-cyan-500/20"
                          >
                            Analyze DNS &rarr;
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.relatedIPs && (
                  <div>
                    <div className="text-slate-400 font-semibold mb-1">Related IP Addresses:</div>
                    <div className="space-y-1">
                      {analysisResult.relatedIPs.map((ip: string, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-cyan-300 font-semibold">{ip}</span>
                          <Button
                            onClick={() => router.push(`/toolkit/ip-scanner?target=${ip}`)}
                            variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-cyan-400 hover:bg-cyan-500/20"
                          >
                            Port Scan &rarr;
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CyberCard>
          </div>

          {/* Shared Correlation Panel */}
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

export default function IocAnalyzerPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs font-mono text-cyan-400">Loading IOC Analyzer...</div>}>
      <IocAnalyzerContent />
    </Suspense>
  );
}
