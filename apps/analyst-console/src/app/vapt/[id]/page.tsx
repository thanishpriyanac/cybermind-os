'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Skeleton } from '../../../components/ui/skeleton';
import { format } from 'date-fns';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldAlert, 
  Play, 
  Lock, 
  FileText, 
  ExternalLink, 
  Code, 
  ShieldCheck, 
  Activity, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  Share2
} from 'lucide-react';

export default function VaptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FINDINGS' | 'OWASP' | 'EVIDENCE' | 'REMEDIATION'>('OVERVIEW');

  const { data: vaptData, isLoading, isError, refetch } = useQuery({
    queryKey: ['vapt-assessment', id],
    queryFn: async () => {
      const res = await api.get(`/v1/vapt/assessments/${id}`);
      return res.data;
    },
    enabled: !!id,
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const assessment = vaptData?.data;

  if (isError || !assessment) {
    return (
      <div className="p-8 text-center text-red-500 font-mono">
        Failed to load VAPT Assessment for ID {id}.
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

  const owaspCategories = [
    { code: 'A01:2021', name: 'Broken Access Control' },
    { code: 'A02:2021', name: 'Cryptographic Failures' },
    { code: 'A03:2021', name: 'Injection' },
    { code: 'A04:2021', name: 'Insecure Design' },
    { code: 'A05:2021', name: 'Security Misconfiguration' },
    { code: 'A06:2021', name: 'Vulnerable and Outdated Components' },
    { code: 'A07:2021', name: 'Identification and Authentication Failures' },
    { code: 'A08:2021', name: 'Software and Data Integrity Failures' },
    { code: 'A09:2021', name: 'Security Logging and Monitoring Failures' },
    { code: 'A10:2021', name: 'Server-Side Request Forgery (SSRF)' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/vapt">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{assessment.name}</h1>
              {assessment.environment === 'DEMO' && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px]">DEMO</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{assessment.target}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending || assessment.status === 'RUNNING'}
            className="bg-primary hover:bg-primary/90 text-black font-semibold text-xs gap-1.5"
          >
            {(runMutation.isPending || assessment.status === 'RUNNING') ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Run Assessment
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => escalateMutation.mutate()}
            disabled={escalateMutation.isPending || !!assessment.investigationId}
            className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs gap-1.5"
          >
            <Activity className="h-3.5 w-3.5 text-amber-400" />
            {assessment.investigationId ? `Escalated (${assessment.investigationId})` : 'Escalate to Investigation'}
          </Button>

          <Button size="sm" variant="outline" onClick={() => exportReport('Developer_Report')} className="text-xs gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export Report
          </Button>
        </div>
      </div>

      {/* Executive Risk Header Card */}
      <Card className="border-border bg-card/80 backdrop-blur-md">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="border-r border-border/60 pr-6">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Overall Risk Score</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-4xl font-black font-mono ${
                  assessment.overallRiskScore >= 80 ? 'text-red-500' :
                  assessment.overallRiskScore >= 60 ? 'text-orange-500' :
                  assessment.overallRiskScore >= 40 ? 'text-yellow-500' : 'text-emerald-400'
                }`}>
                  {assessment.overallRiskScore}
                </span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-2">
                Status: <strong className="text-foreground">{assessment.status}</strong>
              </div>
            </div>

            <div className="col-span-2 space-y-2 text-xs font-mono">
              <div className="text-xs font-bold text-foreground mb-2">Explainable Risk Score Breakdown</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                <div>Severity Impact: <span className="text-foreground font-bold">{breakdown.severityScore}/35</span></div>
                <div>Exploitability: <span className="text-foreground font-bold">{breakdown.exploitabilityScore}/25</span></div>
                <div>CISA KEV Vulnerability: <span className="text-foreground font-bold">{breakdown.cisaKevScore}/20</span></div>
                <div>Internet Exposure: <span className="text-foreground font-bold">{breakdown.exposureScore}/10</span></div>
              </div>
            </div>

            <div className="border-l border-border/60 pl-6 space-y-1.5 text-xs font-mono">
              <div className="text-muted-foreground">Authorization Reference:</div>
              <div className="text-emerald-400 font-bold flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" />
                {assessment.authorization?.reference}
              </div>
              <div className="text-[10px] text-muted-foreground/80 mt-1">Scope Hash: {assessment.authorization?.scopeHash}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border font-mono text-xs overflow-x-auto pb-2">
        {[
          { id: 'OVERVIEW', label: 'Overview' },
          { id: 'FINDINGS', label: `Vulnerabilities (${vulnerabilities.length})` },
          { id: 'OWASP', label: 'OWASP Top 10 Matrix' },
          { id: 'EVIDENCE', label: `Redacted Evidence (${evidences.length})` },
          { id: 'REMEDIATION', label: 'Developer Guidance' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-2 rounded-md font-medium transition-colors ${
              activeTab === t.id ? 'bg-primary text-black font-bold' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vulnerability Summary by Severity</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center">
              <div className="p-3 rounded bg-red-500/10 border border-red-500/30">
                <div className="text-xl font-bold text-red-400">{assessment.findingsCount?.critical || 0}</div>
                <div className="text-[10px] text-red-300">CRITICAL</div>
              </div>
              <div className="p-3 rounded bg-orange-500/10 border border-orange-500/30">
                <div className="text-xl font-bold text-orange-400">{assessment.findingsCount?.high || 0}</div>
                <div className="text-[10px] text-orange-300">HIGH</div>
              </div>
              <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/30">
                <div className="text-xl font-bold text-yellow-400">{assessment.findingsCount?.medium || 0}</div>
                <div className="text-[10px] text-yellow-300">MEDIUM</div>
              </div>
              <div className="p-3 rounded bg-blue-500/10 border border-blue-500/30">
                <div className="text-xl font-bold text-blue-400">{assessment.findingsCount?.low || 0}</div>
                <div className="text-[10px] text-blue-300">LOW</div>
              </div>
              <div className="p-3 rounded bg-muted border border-border">
                <div className="text-xl font-bold text-foreground">{assessment.findingsCount?.total || 0}</div>
                <div className="text-[10px] text-muted-foreground">TOTAL</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: FINDINGS */}
      {activeTab === 'FINDINGS' && (
        <div className="space-y-4">
          {vulnerabilities.map((v: any) => (
            <Card key={v.id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={v.severity === 'CRITICAL' ? 'destructive' : 'outline'} className="font-mono text-xs">
                      {v.severity}
                    </Badge>
                    <CardTitle className="text-base">{v.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      {v.verificationStatus}
                    </Badge>
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                      CVSS {v.cvss}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs leading-relaxed">
                <p className="text-muted-foreground">{v.description}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono bg-muted/40 p-2.5 rounded border border-border">
                  <div><span className="text-muted-foreground">OWASP:</span> <strong className="text-foreground">{v.owaspCategory}</strong></div>
                  <div><span className="text-muted-foreground">CWE:</span> <strong className="text-foreground">{v.cwe}</strong></div>
                  <div><span className="text-muted-foreground">Endpoint:</span> <code className="text-cyan-400">{v.endpoint}</code></div>
                </div>

                {v.cveIds && v.cveIds.length > 0 && (
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-orange-400 font-bold">CVE Correlations:</span>
                    {v.cveIds.map((cve: string) => (
                      <Link key={cve} href={`/cve/${cve}`} className="text-primary hover:underline">
                        {cve}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab: OWASP Top 10 Matrix */}
      {activeTab === 'OWASP' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">OWASP Top 10 (2021) Actionable Matrix</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OWASP Category</TableHead>
                  <TableHead>Category Name</TableHead>
                  <TableHead className="text-center">Findings Count</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {owaspCategories.map((cat) => {
                  const count = vulnerabilities.filter((v: any) => v.owaspCategory === cat.code).length;
                  return (
                    <TableRow key={cat.code}>
                      <TableCell className="font-mono font-bold text-xs">{cat.code}</TableCell>
                      <TableCell className="text-xs font-medium">{cat.name}</TableCell>
                      <TableCell className="text-center font-mono text-xs">{count}</TableCell>
                      <TableCell className="text-right">
                        {count > 0 ? (
                          <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/40 text-[10px]">
                            {count} Violation{count > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-[10px]">
                            Passed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tab: REDACTED EVIDENCE */}
      {activeTab === 'EVIDENCE' && (
        <div className="space-y-4">
          {evidences.map((e: any) => (
            <Card key={e.id} className="border-border">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    {e.source}
                  </CardTitle>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px]">
                    {e.redactionStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs font-mono">
                <div className="text-muted-foreground">Endpoint: <code className="text-cyan-400">{e.endpoint}</code></div>
                <div className="bg-black/90 p-3 rounded border border-border text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {e.observedText}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab: REMEDIATION */}
      {activeTab === 'REMEDIATION' && (
        <div className="space-y-4">
          {vulnerabilities.map((v: any) => (
            <Card key={v.id}>
              <CardHeader>
                <CardTitle className="text-sm font-bold">{v.title} — Developer Fix</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs leading-relaxed">
                <div className="bg-black/90 p-4 rounded border border-border font-mono text-emerald-300 whitespace-pre-wrap">
                  {v.remediation}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
