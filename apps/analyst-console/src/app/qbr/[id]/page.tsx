'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Shield, ArrowLeft, Printer, CheckCircle2, Clock, AlertTriangle, FileCheck, ExternalLink, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function QbrReportView() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ['qbr-report', id],
    queryFn: async () => {
      const res = await api.get(`/v1/qbr/${id}`);
      return res.data.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await api.put(`/v1/qbr/${id}`, { status: newStatus });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qbr-report', id] });
      queryClient.invalidateQueries({ queryKey: ['qbr-reports'] });
    },
  });

  if (isLoading) return <div className="p-8 max-w-4xl mx-auto"><Skeleton className="h-96 w-full rounded-xl" /></div>;
  if (!report) return <div className="p-8 max-w-4xl mx-auto text-center text-muted-foreground">Report not found</div>;

  return (
    <div className="bg-background min-h-screen pb-20">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; color: black !important; }
          .finding-card { break-inside: avoid; border: 1px solid #e2e8f0 !important; }
          .score-box { border: 2px solid #0f172a !important; }
        }
      `}} />

      {/* Action & Status Header Bar */}
      <div className="no-print sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border p-4 shadow-sm mb-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/qbr">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to QBR Reports
              </Button>
            </Link>
            <span className="text-border">|</span>
            <Badge variant="outline" className="font-mono text-xs text-primary bg-primary/10">
              {report.assessmentNumber || report.id}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {/* Lifecycle Status Action Controls */}
            {report.status !== 'FINALIZED' && (
              <div className="flex items-center gap-2 border-r border-border pr-3">
                {report.status === 'DRAFT' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateStatusMutation.isPending}
                    onClick={() => updateStatusMutation.mutate('IN_REVIEW')}
                    className="text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                  >
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    Move to In Review
                  </Button>
                )}
                {report.status === 'IN_REVIEW' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateStatusMutation.isPending}
                    onClick={() => updateStatusMutation.mutate('FINALIZED')}
                    className="text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Finalize Report
                  </Button>
                )}
              </div>
            )}

            <Button onClick={() => window.print()} size="sm" className="bg-primary text-primary-foreground shadow-sm">
              <Printer className="w-4 h-4 mr-2" />
              Print / Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Report Document Container */}
      <div className="max-w-4xl mx-auto bg-card print:bg-white text-foreground print:text-black border print:border-none border-border rounded-xl shadow-lg overflow-hidden">
        
        {/* Cover / Header */}
        <div className="p-10 border-b border-border/50 print:border-gray-300 flex flex-col items-center text-center space-y-6 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-12 h-12 text-primary" />
            <h1 className="text-3xl font-black tracking-wider text-primary">CYBERMIND OS</h1>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Executive QBR Security Briefing</h2>
          <div className="text-2xl font-semibold text-primary/90 mt-4">{report.customerName}</div>
          <div className="text-sm text-muted-foreground">{report.siteName || 'Primary Enterprise Site'}</div>
          
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-left mt-8 text-sm max-w-lg w-full bg-muted/40 p-5 rounded-lg border border-border/50">
            <div className="text-muted-foreground print:text-gray-600 font-medium">Appliance / Vendor</div>
            <div className="font-semibold capitalize text-foreground">{report.vendor} {report.model}</div>
            
            <div className="text-muted-foreground print:text-gray-600 font-medium">Serial Number</div>
            <div className="font-mono text-xs text-foreground">{report.serialNumber || 'SN-NOT-AVAILABLE'}</div>

            <div className="text-muted-foreground print:text-gray-600 font-medium">Firmware Version</div>
            <div className="font-medium text-foreground">{report.firmwareVersion || 'v7.4.x'}</div>
            
            <div className="text-muted-foreground print:text-gray-600 font-medium">Assessment Date</div>
            <div className="font-medium text-foreground">{report.assessmentDate ? format(new Date(report.assessmentDate), 'MMMM do, yyyy') : 'N/A'}</div>
            
            <div className="text-muted-foreground print:text-gray-600 font-medium">Prepared By</div>
            <div className="font-medium text-foreground">{report.preparedBy}</div>

            <div className="text-muted-foreground print:text-gray-600 font-medium">Status Lifecycle</div>
            <div>
              <Badge variant="outline" className="capitalize text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                {report.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Executive CISO Summary */}
        <div className="p-10 border-b border-border/50 print:border-gray-300">
          <h3 className="text-xl font-bold mb-6 border-b pb-3 border-border/50 print:border-gray-300 text-foreground flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary" />
            Executive CISO Summary
          </h3>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground print:text-gray-800 bg-muted/20 p-5 rounded-lg border border-border/40">
              {report.executiveSummary}
            </div>
            <div className="w-full md:w-56 score-box bg-muted/60 print:bg-gray-50 rounded-xl p-6 text-center border border-border">
              <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Compliance Score</div>
              <div className={`text-5xl font-black ${
                report.overallScore >= 80 ? 'text-green-500' : 
                report.overallScore >= 60 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {report.overallScore}%
              </div>
              <div className="text-[11px] text-muted-foreground mt-2 font-medium">CIS FortiGate Benchmark</div>
              <div className="mt-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  report.overallRisk === 'CRITICAL' ? 'bg-red-600/20 text-red-500' :
                  report.overallRisk === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                  report.overallRisk === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {report.overallRisk || 'LOW'} RISK
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Compliance Scorecard */}
        <div className="p-10 border-b border-border/50 print:border-gray-300">
          <h3 className="text-xl font-bold mb-6 border-b pb-3 border-border/50 print:border-gray-300 text-foreground">
            Security Posture Breakdown by Category
          </h3>
          <div className="space-y-4">
            {report.categoryScores && Object.keys(report.categoryScores).length > 0 ? (
              Object.entries(report.categoryScores).map(([cat, score]: [string, any]) => (
                <div key={cat} className="flex items-center justify-between bg-muted/30 print:bg-white print:border print:border-gray-200 p-3.5 rounded-lg border border-border/40">
                  <span className="font-medium text-sm capitalize w-1/3 text-foreground">{cat}</span>
                  <div className="w-1/2 bg-muted rounded-full h-3 overflow-hidden border border-border/50">
                    <div 
                      className={`h-full transition-all ${
                        score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="font-bold text-sm w-16 text-right text-foreground">{score}%</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground italic">No category breakdown recorded.</div>
            )}
          </div>
        </div>

        {/* Audit Findings */}
        <div className="p-10 border-b border-border/50 print:border-gray-300">
          <h3 className="text-xl font-bold mb-6 border-b pb-3 border-border/50 print:border-gray-300 text-foreground">
            Detailed Priority Security Findings
          </h3>
          <div className="space-y-6">
            {report.findings && report.findings.length > 0 ? (
              report.findings.map((f: any, idx: number) => {
                let borderColor = 'border-gray-500';
                if (f.severity === 'CRITICAL') borderColor = 'border-red-600';
                else if (f.severity === 'HIGH') borderColor = 'border-orange-500';
                else if (f.severity === 'MEDIUM') borderColor = 'border-yellow-500';

                return (
                  <div key={`${f.controlId}-${idx}`} className={`finding-card bg-muted/20 print:bg-white p-5 rounded-lg border-l-4 ${borderColor} border-y border-r border-border print:border-gray-300 shadow-sm`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-xs font-mono text-primary font-semibold mb-1">{f.controlId} • {f.category}</div>
                        <h4 className="text-base font-bold text-foreground">{f.name}</h4>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded border uppercase tracking-wide ${
                        f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        f.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        f.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }`}>
                        {f.severity}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-4">
                      <div>
                        <div className="font-semibold text-muted-foreground print:text-gray-600 mb-1">Observed Configuration</div>
                        <div className="bg-background print:bg-gray-50 p-2.5 rounded border border-border/60 font-mono text-muted-foreground">{f.observation || 'No details recorded'}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-muted-foreground print:text-gray-600 mb-1">Exposure & Risk</div>
                        <div className="p-2.5 text-muted-foreground leading-relaxed">{f.risk || 'General perimeter exposure.'}</div>
                      </div>
                    </div>
                    <div className="mt-4 text-xs">
                      <div className="font-semibold text-muted-foreground print:text-gray-600 mb-1">Remediation Action</div>
                      <div className="bg-primary/10 text-primary print:text-black print:bg-white p-3 rounded border border-primary/20 print:border-gray-300 leading-relaxed font-medium">
                        {f.recommendation}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-sm text-emerald-400 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                ✓ No critical or high vulnerability configuration findings identified.
              </div>
            )}
          </div>
        </div>

        {/* Action Roadmap */}
        <div className="p-10">
          <h3 className="text-xl font-bold mb-6 border-b pb-3 border-border/50 print:border-gray-300 text-foreground">
            Prioritized Remediation Roadmap
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted print:bg-gray-100 border-b border-border">
                  <th className="p-3 font-semibold text-muted-foreground">Priority</th>
                  <th className="p-3 font-semibold text-muted-foreground">Finding / Objective</th>
                  <th className="p-3 font-semibold text-muted-foreground">Target Completion</th>
                  <th className="p-3 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.remediationPlan && report.remediationPlan.length > 0 ? (
                  report.remediationPlan.map((r: any, idx: number) => (
                    <tr key={idx} className="border-b border-border/50 print:border-gray-300">
                      <td className="p-3 font-medium capitalize">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          r.priority === 'immediate' ? 'bg-red-500/20 text-red-400' :
                          r.priority === 'short_term' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {r.priority.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-foreground">{r.finding}</td>
                      <td className="p-3 text-muted-foreground">{r.targetDate ? format(new Date(r.targetDate), 'MMM dd, yyyy') : 'N/A'}</td>
                      <td className="p-3"><span className="uppercase text-[11px] font-semibold text-primary">{r.status}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">No pending remediation tasks.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confidentiality Footer */}
        <div className="p-6 bg-muted/40 print:bg-white border-t border-border print:border-gray-300 text-center text-xs text-muted-foreground print:text-gray-500">
          CyberMind OS Executive CISO Briefing | Confidential Security Audit Report | {format(new Date(), 'MMMM do, yyyy')}
        </div>

      </div>
    </div>
  );
}
