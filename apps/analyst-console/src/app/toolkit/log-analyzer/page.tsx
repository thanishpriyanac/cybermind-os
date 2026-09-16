'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Upload, 
  Play, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Bot, 
  ListFilter,
  Search,
  Clock,
  Globe
} from 'lucide-react';
import { CyberPageHeader, CyberCard, CyberMetric, CyberTimeline } from '../../../components/cybermind/CyberPrimitives';
import { CyberSeverityBadge, CyberStatusBadge } from '../../../components/cybermind/CyberBadges';
import { CyberCorrelationPanel } from '../../../components/cybermind/CyberCorrelationPanel';
import { Button } from '../../../components/ui/button';
import { SecurityObject } from '../../../lib/toolkit/types';
import { saveToolkitHistoryItem } from '../../../lib/toolkit/store';

export default function LogAnalyzerPage() {
  const router = useRouter();
  const [logText, setLogText] = useState(`2026-09-16T19:10:02Z date=2026-09-16 time=19:10:02 devname="FG100E-Primary" devid="FG100ETK1800012" logid="0000000013" type="traffic" subtype="forward" level="warning" vd="root" srcip=192.168.1.105 srcport=54210 srcintf="port1" dstip=185.220.101.5 dstport=443 dstintf="wan1" action="deny" policyid=42 service="HTTPS" proto=6 duration=0 sentbyte=0 rcvdbyte=0 msg="Implicit deny policy action executed"
2026-09-16T19:10:05Z Security-Auditing EventID=4625 User="admin" Domain="CORP" SourceIP="185.220.101.5" Status="Failure" Reason="An error occurred during logon (0xc000006d)" Workstation="AUTH-SRV-01"
2026-09-16T19:10:12Z Security-Auditing EventID=4625 User="admin" Domain="CORP" SourceIP="185.220.101.5" Status="Failure" Reason="Account Locked Out"
2026-09-16T19:10:20Z Zscaler-Web-Log User="svc_backup@corp.local" Action="BLOCK" URL="http://login.secure-auth-update-portal.com/auth/verify" ThreatCategory="Credential Harvesting" ClientIP="192.168.1.105"`);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logAnalysisResult, setLogAnalysisResult] = useState<any | null>({
    totalEvents: 4,
    extractedIocs: [
      { type: 'IP', value: '185.220.101.5', count: 3, risk: 'HIGH' },
      { type: 'IP', value: '192.168.1.105', count: 2, risk: 'LOW' },
      { type: 'DOMAIN', value: 'login.secure-auth-update-portal.com', count: 1, risk: 'CRITICAL' },
      { type: 'USER', value: 'admin', count: 2, risk: 'MEDIUM' },
      { type: 'USER', value: 'svc_backup@corp.local', count: 1, risk: 'MEDIUM' },
    ],
    timelineEvents: [
      { id: '1', time: '19:10:02Z', title: 'FortiGate Blocked Traffic', description: 'Denied HTTPS connection 192.168.1.105 -> 185.220.101.5:443 (Policy #42)', type: 'alert', user: 'FG100E' },
      { id: '2', time: '19:10:05Z', title: 'Windows Failed Logon (EventID 4625)', description: 'Authentication failure for user "admin" from IP 185.220.101.5', type: 'alert', user: 'admin' },
      { id: '3', time: '19:10:12Z', title: 'Account Lockout Event', description: 'Account "admin" locked out following repeated failure attempts', type: 'alert', user: 'admin' },
      { id: '4', time: '19:10:20Z', title: 'Zscaler Web Block', description: 'Blocked URL "http://login.secure-auth-update-portal.com" (Credential Harvesting)', type: 'response', user: 'svc_backup' },
    ],
    anomalies: [
      'Brute-force password guessing sequence from external IP 185.220.101.5 targeting Domain Admin account',
      'Concurrent web connection to credential harvesting phishing portal from endpoint 192.168.1.105',
    ],
  });

  const handleAnalyzeLogs = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      saveToolkitHistoryItem({
        toolId: 'log-analyzer',
        toolName: 'Security Log Analyzer',
        target: 'Pasted Log Stream',
        risk: 'HIGH',
        summaryText: `Parsed ${logAnalysisResult.totalEvents} Log Events — Extracted ${logAnalysisResult.extractedIocs.length} IOCs`,
        data: logAnalysisResult,
      });
    }, 900);
  };

  const selectedSecurityObject: SecurityObject | null = logAnalysisResult ? {
    id: `obj-log-${Date.now()}`,
    type: 'LOG_EVENT',
    value: 'FortiGate + Windows + Zscaler Log Stream',
    source: 'Log Analyzer',
    timestamp: new Date().toISOString(),
    risk: 'HIGH',
    confidence: 95,
    tags: ['log-parser', 'ioc-extraction', 'brute-force', 'credential-harvesting'],
    metadata: logAnalysisResult,
  } : null;

  return (
    <div className="space-y-6">
      <CyberPageHeader
        title="Generic Security Log Analyzer & Parser"
        description="Parse, normalize, and extract actionable IOCs from FortiGate, Windows Event, Syslog, VPN, and Zscaler logs."
        breadcrumbs={[
          { label: 'Security Toolkit', href: '/toolkit/ioc-analyzer' },
          { label: 'Log Analyzer' },
        ]}
        badge={<CyberStatusBadge status="ACTIVE" />}
      />

      {/* Input */}
      <CyberCard className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-medium text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Paste Security Logs or Upload Log File (.log, .txt, .csv, .json)</span>
          </label>
        </div>

        <textarea
          value={logText}
          onChange={(e) => setLogText(e.target.value)}
          rows={6}
          className="w-full p-3 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        />

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs font-mono text-slate-400">
            Supported Formats: Syslog, FortiGate, Windows Event XML/TXT, CEF, JSON, CSV
          </div>

          <Button
            onClick={handleAnalyzeLogs}
            disabled={isAnalyzing || !logText}
            className="h-9 px-6 font-mono text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
          >
            {isAnalyzing ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-spin" />
                Parsing & Extracting IOCs...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Analyze Log Stream
              </>
            )}
          </Button>
        </div>
      </CyberCard>

      {/* Results */}
      {logAnalysisResult && !isAnalyzing && (
        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <CyberMetric
              title="Total Events Parsed"
              value={logAnalysisResult.totalEvents}
              accentColor="cyan"
              icon={<FileText />}
            />
            <CyberMetric
              title="Extracted IOCs"
              value={logAnalysisResult.extractedIocs.length}
              subtitle="IPs, Domains, Users"
              accentColor="purple"
              icon={<Search />}
            />
            <CyberMetric
              title="Detected Anomalies"
              value={logAnalysisResult.anomalies.length}
              subtitle="Requires Triage"
              accentColor="red"
              icon={<ShieldAlert />}
            />
            <CyberMetric
              title="Incident Severity"
              value="HIGH"
              accentColor="orange"
              icon={<Activity />}
            />
          </div>

          {/* IOC Extraction Cards */}
          <CyberCard className="p-5 space-y-4">
            <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Automatically Extracted Clickable IOCs</span>
              <span className="text-xs text-slate-400 font-normal">Click any indicator to pivot</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
              {logAnalysisResult.extractedIocs.map((ioc: any, idx: number) => (
                <div key={idx} className="p-3 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">{ioc.type}</div>
                    <div className="font-bold text-cyan-300 truncate max-w-[160px]" title={ioc.value}>{ioc.value}</div>
                    <div className="text-[10px] text-slate-500">Occurrences: {ioc.count}</div>
                  </div>
                  <Button
                    onClick={() => router.push(`/toolkit/ioc-analyzer?target=${encodeURIComponent(ioc.value)}`)}
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] font-mono border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                  >
                    Analyze &rarr;
                  </Button>
                </div>
              ))}
            </div>
          </CyberCard>

          {/* Timeline & Anomalies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CyberCard className="p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3">
                Chronological Log Event Timeline
              </h3>
              <CyberTimeline events={logAnalysisResult.timelineEvents} />
            </CyberCard>

            <CyberCard className="p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Detected Security Anomalies</span>
              </h3>

              <div className="space-y-2.5 font-mono text-xs">
                {logAnalysisResult.anomalies.map((anom: string, idx: number) => (
                  <div key={idx} className="p-3 rounded bg-red-950/20 border border-red-500/30 text-red-300 leading-relaxed">
                    <span className="font-bold block mb-1">Anomaly #{idx + 1}:</span>
                    {anom}
                  </div>
                ))}
              </div>
            </CyberCard>
          </div>

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
