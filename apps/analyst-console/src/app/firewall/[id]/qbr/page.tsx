'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function QbrBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [executiveSummary, setExecutiveSummary] = useState('');
  
  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', id],
    queryFn: async () => {
      const res = await api.get('/v1/firewall/assessments');
      const item = res.data.find((a: any) => a.id === id);
      return item;
    },
  });

  useEffect(() => {
    if (assessment && !executiveSummary) {
      let criticals = 0;
      let highs = 0;
      
      api.get('/v1/firewall/controls').then(res => {
         const controls = res.data[assessment.vendor] || [];
         assessment.findings.forEach((f: any) => {
           if (f.status === 'FAIL') {
             const c = controls.find((x: any) => x.id === f.controlId);
             if (c?.severity === 'CRITICAL') criticals++;
             if (c?.severity === 'HIGH') highs++;
           }
         });
         
         const template = `This Quarterly Business Review report presents the findings from the ${assessment.vendor} ${assessment.model} security assessment conducted on ${format(new Date(assessment.assessmentDate), 'MMMM do, yyyy')}. The overall security health score is ${assessment.overallScore}/100. ${criticals} critical and ${highs} high severity findings were identified requiring immediate attention.`;
         setExecutiveSummary(template);
      });
    }
  }, [assessment]);

  const generateReport = useMutation({
    mutationFn: async () => {
      const res = await api.post('/v1/qbr', {
        assessmentId: assessment.id,
        preparedBy: 'CyberMind Analyst',
        executiveSummary,
      });
      return res.data;
    },
    onSuccess: (data) => {
      router.push(`/qbr/${data.data.id}`);
    }
  });

  if (isLoading) return <div className="p-8"><Skeleton className="h-20 w-full" /></div>;
  if (!assessment) return <div>Assessment not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Generate QBR Report</h1>
        <Button onClick={() => generateReport.mutate()} disabled={generateReport.isPending}>
          {generateReport.isPending ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Customer Name</label>
              <div className="text-muted-foreground">{assessment.customerName}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Vendor & Model</label>
              <div className="text-muted-foreground capitalize">{assessment.vendor} {assessment.model}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Report Date</label>
              <div className="text-muted-foreground">{format(new Date(), 'MMM dd, yyyy')}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Overall Score</label>
              <div>
                <Badge variant={assessment.overallScore >= 80 ? 'default' : assessment.overallScore >= 50 ? 'secondary' : 'destructive'} className={assessment.overallScore >= 50 && assessment.overallScore < 80 ? 'bg-yellow-500 text-black' : ''}>
                  {assessment.overallScore}/100
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Executive Summary</label>
            <textarea 
              className="w-full min-h-[150px] p-3 rounded-md bg-muted border border-border focus:ring-1 focus:ring-primary text-sm"
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Content Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">The report will automatically include:</p>
          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
            <li>Category score breakdown table</li>
            <li>All findings categorized by severity (excluding passed checks)</li>
            <li>Auto-generated 3-tier Remediation Plan</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
