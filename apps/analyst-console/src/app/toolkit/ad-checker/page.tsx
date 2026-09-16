'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Play, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Bot, 
  Users, 
  Lock,
  FileText
} from 'lucide-react';
import { CyberPageHeader, CyberCard, CyberMetric } from '../../../components/cybermind/CyberPrimitives';
import { CyberSeverityBadge, CyberStatusBadge } from '../../../components/cybermind/CyberBadges';
import { CyberCorrelationPanel } from '../../../components/cybermind/CyberCorrelationPanel';
import { Button } from '../../../components/ui/button';
import { SecurityObject } from '../../../lib/toolkit/types';
import { saveToolkitHistoryItem } from '../../../lib/toolkit/store';

interface AdFinding {
  object: string;
  type: 'USER' | 'GROUP' | 'SERVICE_ACCOUNT' | 'POLICY';
  finding: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  recommendation: string;
  evidence: string;
}

export default function AdSecurityCheckerPage() {
  const router = useRouter();
  const [isAuditing, setIsAuditing] = useState(false);
  const [adFindings, setAdFindings] = useState<AdFinding[]>([
    {
      object: 'svc_backup',
      type: 'SERVICE_ACCOUNT',
      finding: 'Password Never Expires & Domain Admin Privileges',
      severity: 'CRITICAL',
      reason: 'Service account has unrestricted Domain Admin privileges with non-expiring static password.',
      recommendation: 'Migrate to Group Managed Service Accounts (gMSA) and remove Domain Admin group membership.',
      evidence: 'userAccountControl = 0x10200 (DONT_EXPIRE_PASSWORD), memberOf = CN=Domain Admins',
    },
    {
      object: 'CORP.LOCAL Domain Policy',
      type: 'POLICY',
      finding: 'LAPS Not Enforced for Local Administrator Accounts',
      severity: 'HIGH',
      reason: 'Local Administrator passwords across workstation endpoints are uniform and static.',
      recommendation: 'Deploy Microsoft LAPS GPO to randomize local admin passwords automatically.',
      evidence: 'ms-Mcs-AdmPwd attribute missing on 142 computer objects',
    },
    {
      object: 'j.doe_temp',
      type: 'USER',
      finding: 'Inactive Privileged Account (> 90 Days)',
      severity: 'MEDIUM',
      reason: 'User account has not authenticated since 2026-05-12 but remains active.',
      recommendation: 'Disable inactive accounts after 30 days of inactivity.',
      evidence: 'lastLogonTimestamp = 133918239000000000',
    },
  ]);

  const handleRunAdAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      saveToolkitHistoryItem({
        toolId: 'ad-checker',
        toolName: 'Active Directory Security Checker',
        target: 'CORP.LOCAL Domain Controller',
        risk: 'CRITICAL',
        summaryText: `Audited Active Directory — Found 1 CRITICAL (svc_backup), 1 HIGH, 1 MEDIUM finding`,
        data: adFindings,
      });
    }, 1000);
  };

  const selectedSecurityObject: SecurityObject | null = adFindings.length > 0 ? {
    id: `obj-ad-${adFindings[0].object}`,
    type: 'USER',
    value: adFindings[0].object,
    source: 'Active Directory Security Checker',
    timestamp: new Date().toISOString(),
    risk: 'CRITICAL',
    confidence: 98,
    tags: ['active-directory', 'domain-admin', 'gmsa', 'laps-missing'],
    metadata: adFindings[0],
  } : null;

  return (
    <div className="space-y-6">
      <CyberPageHeader
        title="Active Directory Security Posture & Privilege Checker"
        description="Audit Active Directory domain accounts, stale credentials, Domain Admin privileges, password policies, and LAPS status."
        breadcrumbs={[
          { label: 'Security Toolkit', href: '/toolkit/ioc-analyzer' },
          { label: 'AD Security Checker' },
        ]}
        badge={<CyberStatusBadge status="HEALTHY" />}
      />

      {/* Header Audit Trigger */}
      <CyberCard className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Target Domain: <span className="text-cyan-300">CORP.LOCAL</span> (Primary DC: dc01.corp.local)</span>
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Last Assessment: 2026-09-16 18:30 UTC | 412 User Objects | 18 Domain Admins
          </p>
        </div>

        <Button
          onClick={handleRunAdAudit}
          disabled={isAuditing}
          className="h-9 px-6 font-mono text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold shrink-0"
        >
          {isAuditing ? (
            <>
              <Activity className="w-4 h-4 mr-2 animate-spin" />
              Auditing AD Objects...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2 fill-current" />
              Run AD Security Assessment
            </>
          )}
        </Button>
      </CyberCard>

      {/* Audit Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <CyberMetric
          title="Privileged Accounts"
          value="18"
          subtitle="Domain Admin Members"
          accentColor="cyan"
          icon={<Users />}
        />
        <CyberMetric
          title="Critical AD Findings"
          value={adFindings.filter(f => f.severity === 'CRITICAL').length}
          subtitle="Requires Immediate Action"
          accentColor="red"
          icon={<ShieldAlert />}
        />
        <CyberMetric
          title="LAPS Status"
          value="NOT ENFORCED"
          subtitle="142 Endpoint Workstations"
          accentColor="orange"
          icon={<Lock />}
        />
        <CyberMetric
          title="Stale/Inactive Accounts"
          value="14"
          subtitle="Inactive > 90 Days"
          accentColor="yellow"
          icon={<AlertTriangle />}
        />
      </div>

      {/* Findings Table */}
      <CyberCard className="p-5 space-y-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-mono font-bold text-slate-100">
            Active Directory Vulnerability & Misconfiguration Audit Findings
          </h3>
          <Button
            onClick={() => router.push(`/copilot?prompt=${encodeURIComponent(`Generate a step-by-step Active Directory remediation plan for the findings in CORP.LOCAL.`)}`)}
            variant="outline"
            size="sm"
            className="h-7 text-xs font-mono border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20"
          >
            <Bot className="w-3.5 h-3.5 mr-1" />
            Generate AD Remediation Plan
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                <th className="py-2.5 px-3">Affected Object</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Security Finding</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Reason & Recommendation</th>
                <th className="py-2.5 px-3">Technical Evidence</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {adFindings.map((fd, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-3 font-bold text-cyan-400">{fd.object}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {fd.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-200">{fd.finding}</td>
                  <td className="py-3 px-3">
                    <CyberSeverityBadge severity={fd.severity} />
                  </td>
                  <td className="py-3 px-3 max-w-xs space-y-1">
                    <div className="text-slate-300">{fd.reason}</div>
                    <div className="text-emerald-400 text-[11px] font-sans">Fix: {fd.recommendation}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px] max-w-xs truncate" title={fd.evidence}>
                    {fd.evidence}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      onClick={() => router.push(`/copilot?prompt=${encodeURIComponent(`Explain AD Finding for ${fd.object}: ${fd.finding}`)}`)}
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] font-mono border-slate-700 hover:bg-slate-800"
                    >
                      Explain
                    </Button>
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
  );
}
