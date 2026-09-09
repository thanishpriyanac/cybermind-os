'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ShieldAlert, Shield, ShieldCheck, Printer, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function QbrReportView() {
  const params = useParams();
  const id = params.id as string;

  const { data: report, isLoading } = useQuery({
    queryKey: ['qbr-report', id],
    queryFn: async () => {
      const res = await api.get(`/v1/qbr/${id}`);
      return res.data.data;
    },
  });

  if (isLoading) return <div className="p-8 max-w-4xl mx-auto"><Skeleton className="h-64 w-full" /></div>;
  if (!report) return <div className="p-8 max-w-4xl mx-auto">Report not found</div>;

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

      {/* Action Bar */}
      <div className="no-print sticky top-0 z-10 bg-card border-b border-border p-4 flex justify-between items-center max-w-5xl mx-auto rounded-b-xl shadow-sm mb-8">
        <Link href={`/firewall/${report.assessmentId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assessment
          </Button>
        </Link>
        <Button onClick={() => window.print()} size="sm">
          <Printer className="w-4 h-4 mr-2" />
          Print / Export PDF
        </Button>
      </div>

      {/* Report Container */}
      <div className="max-w-4xl mx-auto bg-card print:bg-white text-foreground print:text-black border print:border-none border-border rounded-xl shadow-sm overflow-hidden">
        
        {/* Cover / Header */}
        <div className="p-10 border-b border-border/50 print:border-gray-300 flex flex-col items-center text-center space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-primary" />
            <h1 className="text-3xl font-black tracking-wider text-primary">CYBERMIND OS</h1>
          </div>
          <h2 className="text-4xl font-bold tracking-tight">Security Assessment Report</h2>
          <div className="text-3xl font-semibold mt-6">{report.customerName}</div>
          
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-left mt-8 text-sm max-w-lg w-full">
            <div className="text-muted-foreground print:text-gray-600">Vendor / Model</div>
            <div className="font-medium capitalize">{report.vendor} {report.model}</div>
            
            <div className="text-muted-foreground print:text-gray-600">Firmware</div>
            <div className="font-medium">{report.firmwareVersion}</div>
            
            <div className="text-muted-foreground print:text-gray-600">Assessment Date</div>
            <div className="font-medium">{format(new Date(report.assessmentDate), 'MMMM do, yyyy')}</div>
            
            <div className="text-muted-foreground print:text-gray-600">Prepared By</div>
            <div className="font-medium">{report.preparedBy}</div>
          </div>
        </div>

        {/* Exec Summary */}
        <div className="p-10 border-b border-border/50 print:border-gray-300">
          <h3 className="text-2xl font-bold mb-6 border-b pb-2 border-border/50 print:border-gray-300">Executive Summary</h3>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 text-sm leading-relaxed whitespace-pre-wrap">
              {report.executiveSummary}
            </div>
            <div className="w-48 score-box bg-muted print:bg-gray-50 rounded-xl p-6 text-center border border-border">
              <div className="text-sm font-semibold uppercase tracking-wider mb-2">Health Score</div>
              <div className={`text-6xl font-black ${
                report.overallScore >= 80 ? 'text-green-500' : 
                report.overallScore >= 50 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {report.overallScore}
              </div>
              <div className="text-xs text-muted-foreground mt-1">out of 100</div>
            </div>
          </div>
        </div>

        {/* Category Scores */}
        <div className="p-10 border-b border-border/50 print:border-gray-300">
          <h3 className="text-2xl font-bold mb-6 border-b pb-2 border-border/50 print:border-gray-300">Security Posture by Category</h3>
          <div className="space-y-4">
            {Object.entries(report.categoryScores).map(([cat, score]: [string, any]) => (
              <div key={cat} className="flex items-center justify-between bg-muted/50 print:bg-white print:border print:border-gray-200 p-3 rounded-lg">
                <span className="font-medium capitalize w-1/3">{cat}</span>
                <div className="w-1/2 bg-muted rounded-full h-3 overflow-hidden border border-border/50">
                  <div 
                    className={`h-full ${
                      score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="font-bold w-12 text-right">{score}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Findings */}
        <div className="p-10 border-b border-border/50 print:border-gray-300">
          <h3 className="text-2xl font-bold mb-6 border-b pb-2 border-border/50 print:border-gray-300">Detailed Findings</h3>
          <div className="space-y-6">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'].map(sev => {
              const sevFindings = report.findings.filter((f: any) => f.severity === sev);
              if (sevFindings.length === 0) return null;
              
              let borderColor = 'border-gray-500';
              if (sev === 'CRITICAL') borderColor = 'border-red-600';
              if (sev === 'HIGH') borderColor = 'border-orange-500';
              if (sev === 'MEDIUM') borderColor = 'border-yellow-500';

              return sevFindings.map((f: any, idx: number) => (
                <div key={`${f.controlId}-${idx}`} className={`finding-card bg-muted/30 print:bg-white p-5 rounded-lg border-l-4 ${borderColor} border-y border-r border-border print:border-gray-300 shadow-sm`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-xs font-mono text-muted-foreground mb-1">{f.controlId} - {f.category}</div>
                      <h4 className="text-lg font-bold">{f.name}</h4>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-background rounded border border-border uppercase tracking-wide">
                      {f.severity}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
                    <div>
                      <div className="font-semibold text-muted-foreground print:text-gray-600 mb-1">Observation</div>
                      <div className="bg-background print:bg-gray-50 p-2 rounded border border-border/50">{f.observation || 'No details provided'}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-muted-foreground print:text-gray-600 mb-1">Risk</div>
                      <div className="p-2">{f.risk || 'General misconfiguration risk.'}</div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm">
                    <div className="font-semibold text-muted-foreground print:text-gray-600 mb-1">Recommendation</div>
                    <div className="bg-primary/5 text-primary print:text-black print:bg-white p-3 rounded border border-primary/20 print:border-gray-300">{f.recommendation}</div>
                  </div>
                </div>
              ));
            })}
          </div>
        </div>

        {/* Remediation Plan */}
        <div className="p-10">
          <h3 className="text-2xl font-bold mb-6 border-b pb-2 border-border/50 print:border-gray-300">Remediation Plan</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-muted print:bg-gray-100 border-b border-border">
                  <th className="p-3 font-semibold">Priority</th>
                  <th className="p-3 font-semibold">Finding</th>
                  <th className="p-3 font-semibold">Target Date</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {['immediate', 'short_term', 'long_term'].map(priority => {
                  const items = report.remediationPlan.filter((r: any) => r.priority === priority);
                  if (items.length === 0) return null;
                  
                  return items.map((r: any, idx: number) => (
                    <tr key={`${priority}-${idx}`} className="border-b border-border/50 print:border-gray-300">
                      <td className="p-3 font-medium capitalize">
                        <span className={`px-2 py-1 rounded text-xs ${
                          priority === 'immediate' ? 'bg-red-500/10 text-red-500 print:text-red-700' :
                          priority === 'short_term' ? 'bg-orange-500/10 text-orange-500 print:text-orange-700' :
                          'bg-blue-500/10 text-blue-500 print:text-blue-700'
                        }`}>
                          {priority.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{r.finding}</td>
                      <td className="p-3 text-muted-foreground">{format(new Date(r.targetDate), 'MMM dd, yyyy')}</td>
                      <td className="p-3"><span className="uppercase text-xs font-semibold">{r.status}</span></td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-muted/50 print:bg-white border-t border-border print:border-gray-300 text-center text-xs text-muted-foreground print:text-gray-500">
          Generated by CyberMind OS | Confidential | {format(new Date(report.reportDate), 'MMMM do, yyyy HH:mm z')}
        </div>

      </div>
    </div>
  );
}
