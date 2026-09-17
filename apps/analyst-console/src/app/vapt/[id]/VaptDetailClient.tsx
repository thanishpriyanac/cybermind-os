'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  Play, 
  Lock, 
  Activity, 
  Loader2, 
  Download,
  ShieldCheck,
  Code,
  Copy,
  AlertTriangle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { VaptPageHeader } from '../../../components/vapt/VaptPageHeader';
import { VaptRiskBadge, VaptStatusBadge } from '../../../components/vapt/VaptBadges';
import { VaptFindingTable } from '../../../components/vapt/VaptFindingTable';
import { VaptEvidenceCard } from '../../../components/vapt/VaptEvidenceCard';
import { VaptOwaspMatrix } from '../../../components/vapt/VaptOwaspMatrix';
import { VaptCveCard } from '../../../components/vapt/VaptCveCard';
import { VaptRunningScreen } from '../../../components/vapt/VaptRunningScreen';
import { VaptErrorState } from '../../../components/vapt/VaptErrorState';

export default function VaptDetailPage({ routeId }: { routeId?: string } = {}) {
  const params = useParams();
  const router = useRouter();
  const id = routeId || (params?.id as string);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FINDINGS' | 'OWASP' | 'EVIDENCE' | 'CVE' | 'REMEDIATION'>('OVERVIEW');
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  const { data: vaptData, isLoading, isError, refetch } = useQuery({
    queryKey: ['vapt-assessment', id],
    queryFn: async () => {
      const res = await api.get(`/v1/vapt/assessments/${id}`);
      return res.data;
    },
    enabled: !!id,
    staleTime: 5000,
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/v1/vapt/assessments/${id}/run`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vapt-assessment', id] });
    },
  });

  const escalateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/v1/vapt/assessments/${id}/escalate`);
      return res.data;
    },
    onSuccess: (data) => {
      router.push(`/investigations/${data.data.investigationId}`);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotice('Copied remediation snippet to clipboard');
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const assessment = vaptData?.data;

  if (isError || !assessment) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <VaptPageHeader title="VAPT Assessment Detail" backHref="/vapt" />
        <VaptErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const vulnerabilities = assessment.vulnerabilities || [];
  const evidences = assessment.evidences || [];
  const breakdown = assessment.riskBreakdown || { severityScore: 0, exploitabilityScore: 0, cisaKevScore: 0, exposureScore: 0, criticalityScore: 0, totalRiskScore: 0 };

  const exportReport = (formatType: string) => {
    const jsonStr = JSON.stringify(assessment, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VAPT_Audit_${assessment.id}_${formatType}.json`;
    a.click();
  };

  // Collect unique CVE IDs from vulnerabilities
  const allCveIds: string[] = Array.from(
    new Set(vulnerabilities.flatMap((v: any) => v.cveIds || []))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {copiedNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-black font-semibold text-xs font-mono px-4 py-3 rounded-xl shadow-lg">
          {copiedNotice}
        </div>
      )}

      {/* Header */}
      <VaptPageHeader
        title={assessment.name}
        subtitle={assessment.target}
        backHref="/vapt"
        badge={
          assessment.environment === 'DEMO' ? (
            <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px] font-mono">DEMO</Badge>
          ) : (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-[10px] font-mono">PRODUCTION</Badge>
          )
        }
        actions={
          <>
            <Button
              size="sm"
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending || assessment.status === 'RUNNING'}
              className="bg-primary hover:bg-primary/90 text-black font-extrabold text-xs h-10 px-4 gap-1.5 shadow-md"
            >
              {(runMutation.isPending || assessment.status === 'RUNNING') ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              <span>Run Assessment</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => escalateMutation.mutate()}
              disabled={escalateMutation.isPending || !!assessment.investigationId}
              className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-mono h-10 px-4 gap-1.5"
            >
              <Activity className="h-3.5 w-3.5 text-amber-400" />
              <span>{assessment.investigationId ? `Escalated (${assessment.investigationId})` : 'Escalate to Investigation'}</span>
            </Button>

            <Button size="sm" variant="outline" onClick={() => exportReport('Audit_Report')} className="text-xs font-mono h-10 px-4 gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </Button>
          </>
        }
      />

      {/* Assessment Running Screen (If active) */}
      {(assessment.status === 'RUNNING' || runMutation.isPending) && (
        <VaptRunningScreen
          target={assessment.target}
          progressPercent={72}
          completedChecks={38}
          totalChecks={52}
          findingsCount={vulnerabilities.length}
          currentOperation="OWASP Top 10 Automated Probe Sequence"
        />
      )}

      {/* Executive Risk Header Card */}
      <Card className="border-border bg-card/80 backdrop-blur-md shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            {/* Overall Risk Score */}
            <div className="border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Overall Risk Score</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-4xl font-black font-mono ${
                  assessment.overallRiskScore >= 80 ? 'text-red-500' :
                  assessment.overallRiskScore >= 60 ? 'text-orange-500' :
                  assessment.overallRiskScore >= 40 ? 'text-yellow-500' : 'text-emerald-400'
                }`}>
                  {assessment.overallRiskScore}
                </span>
                <span className="text-sm text-muted-foreground font-mono">/ 100</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <VaptStatusBadge status={assessment.status} />
                <VaptRiskBadge score={assessment.overallRiskScore || 0} showScore={false} />
              </div>
            </div>

            {/* Risk Score Breakdown */}
            <div className="col-span-1 md:col-span-2 space-y-2 text-xs font-mono">
              <div className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">Explainable Risk Score Breakdown</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-muted-foreground">
                <div>Severity Impact: <span className="text-foreground font-bold">{breakdown.severityScore}/35</span></div>
                <div>Exploitability: <span className="text-foreground font-bold">{breakdown.exploitabilityScore}/25</span></div>
                <div>CISA KEV Vulnerability: <span className="text-foreground font-bold">{breakdown.cisaKevScore}/20</span></div>
                <div>Internet Exposure: <span className="text-foreground font-bold">{breakdown.exposureScore}/10</span></div>
              </div>
            </div>

            {/* Authorization & Scope Hash */}
            <div className="border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 space-y-1.5 text-xs font-mono">
              <div className="text-muted-foreground uppercase text-[10px]">Authorization Ticket</div>
              <div className="text-emerald-400 font-bold flex items-center gap-1.5 text-sm">
                <Lock className="h-4 w-4 shrink-0" />
                <span>{assessment.authorization?.reference || 'AUTH-OK'}</span>
              </div>
              <div className="text-[10px] text-muted-foreground/80 mt-1 truncate">
                Hash: {assessment.authorization?.scopeHash || 'a7b8c9d0...'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs (Responsive Overflow Scroll) */}
      <div className="flex items-center gap-1.5 border-b border-border font-mono text-xs overflow-x-auto pb-2 whitespace-nowrap">
        {[
          { id: 'OVERVIEW', label: 'Overview' },
          { id: 'FINDINGS', label: `Vulnerabilities (${vulnerabilities.length})` },
          { id: 'OWASP', label: 'OWASP Top 10 Matrix' },
          { id: 'EVIDENCE', label: `Redacted Evidence (${evidences.length})` },
          { id: 'CVE', label: `CVE Intelligence (${allCveIds.length})` },
          { id: 'REMEDIATION', label: 'Developer Guidance' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-2 rounded-lg font-medium transition-colors ${
              activeTab === t.id ? 'bg-primary text-black font-extrabold shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold font-mono">Vulnerability Breakdown by Severity</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center">
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="text-2xl font-black text-red-400">{assessment.findingsCount?.critical || 0}</div>
                <div className="text-[10px] text-red-300 uppercase font-bold mt-1">CRITICAL</div>
              </div>
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30">
                <div className="text-2xl font-black text-orange-400">{assessment.findingsCount?.high || 0}</div>
                <div className="text-[10px] text-orange-300 uppercase font-bold mt-1">HIGH</div>
              </div>
              <div className="p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <div className="text-2xl font-black text-yellow-400">{assessment.findingsCount?.medium || 0}</div>
                <div className="text-[10px] text-yellow-300 uppercase font-bold mt-1">MEDIUM</div>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <div className="text-2xl font-black text-blue-400">{assessment.findingsCount?.low || 0}</div>
                <div className="text-[10px] text-blue-300 uppercase font-bold mt-1">LOW</div>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border">
                <div className="text-2xl font-black text-foreground">{vulnerabilities.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">TOTAL</div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Findings Overview Table */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm font-mono">Top Discovered Vulnerabilities</h3>
            <VaptFindingTable findings={vulnerabilities.slice(0, 5)} onCopyRemediation={copyToClipboard} />
          </div>
        </div>
      )}

      {/* TAB 2: FINDINGS */}
      {activeTab === 'FINDINGS' && (
        <VaptFindingTable findings={vulnerabilities} onCopyRemediation={copyToClipboard} />
      )}

      {/* TAB 3: OWASP TOP 10 MATRIX */}
      {activeTab === 'OWASP' && (
        <VaptOwaspMatrix vulnerabilities={vulnerabilities} />
      )}

      {/* TAB 4: REDACTED EVIDENCE */}
      {activeTab === 'EVIDENCE' && (
        <div className="space-y-4">
          {evidences.length > 0 ? (
            evidences.map((e: any) => (
              <VaptEvidenceCard key={e.id} evidence={e} onCopy={copyToClipboard} />
            ))
          ) : (
            <Card className="p-8 text-center text-muted-foreground font-mono text-xs">
              No evidence telemetry attached to this assessment.
            </Card>
          )}
        </div>
      )}

      {/* TAB 5: CVE INTELLIGENCE */}
      {activeTab === 'CVE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allCveIds.length > 0 ? (
            allCveIds.map((cve) => (
              <VaptCveCard
                key={cve}
                cveId={cve}
                cvss={9.8}
                isKev={true}
                affectedAsset={assessment.target}
              />
            ))
          ) : (
            <Card className="col-span-2 p-8 text-center text-muted-foreground font-mono text-xs">
              No CVE correlations recorded for current assessment scope.
            </Card>
          )}
        </div>
      )}

      {/* TAB 6: DEVELOPER FIXES & REMEDIATION */}
      {activeTab === 'REMEDIATION' && (
        <div className="space-y-4">
          {vulnerabilities.map((v: any) => (
            <Card key={v.id} className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold font-mono text-foreground">{v.title} — Fix Playbook</CardTitle>
                  {v.remediation && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(v.remediation)}
                      className="h-7 text-xs font-mono text-emerald-400 gap-1 hover:text-emerald-300"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </Button>
                  )}
                </div>
                <CardDescription className="text-xs font-mono text-cyan-400 font-semibold">
                  {v.owaspCategory} | {v.cwe}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2">
                <div className="p-4 bg-black/95 rounded-xl border border-border font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                  {v.remediation || '// No custom code snippet provided.'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

