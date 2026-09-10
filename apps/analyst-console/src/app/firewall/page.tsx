'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Shield, Activity, AlertTriangle, FileText } from 'lucide-react';
import { api } from '@/lib/api';

interface AssessmentSummary {
  id: string;
  vendor: string;
  customerName: string;
  siteName: string;
  model: string;
  assessmentDate: string;
  overallScore: number;
  status: string;
  stats: {
    total: number;
    critical: number;
  };
}

export default function FirewallAssessmentsPage() {
  const { data: assessments, isLoading, error } = useQuery<AssessmentSummary[]>({
    queryKey: ['firewall-assessments'],
    queryFn: async () => {
      const res = await api.get('/v1/firewall/assessments');
      return res.data;
    },
  });

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge variant="secondary" className="bg-green-500/20 text-green-500 hover:bg-green-500/30">{score}%</Badge>;
    if (score >= 60) return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">{score}%</Badge>;
    return <Badge variant="destructive">{score}%</Badge>;
  };

  const getVendorName = (vendor: string) => {
    const map: Record<string, string> = {
      fortinet: 'Fortinet',
      paloalto: 'Palo Alto',
      sophos: 'Sophos',
      cisco: 'Cisco',
      checkpoint: 'Check Point',
    };
    return map[vendor] || vendor;
  };

  const totalAssessments = assessments?.length || 0;
  const avgScore = totalAssessments > 0 
    ? Math.round(assessments!.reduce((acc, curr) => acc + curr.overallScore, 0) / totalAssessments) 
    : 0;
  const totalCritical = assessments?.reduce((acc, curr) => acc + curr.stats.critical, 0) || 0;
  const openAssessments = assessments?.filter(a => a.status === 'draft').length || 0;

  return (
    <div className="flex-1 space-y-4 p-3 sm:p-6 md:p-8 pt-4 sm:pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Firewall Health Check</h2>
        <div className="flex items-center space-x-2">
          <Link href="/firewall/new">
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              New Assessment
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{totalAssessments}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{avgScore}%</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Findings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{totalCritical}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Assessments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{openAssessments}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Assessments</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto w-full">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="text-red-500">Failed to load assessments</div>
          ) : assessments?.length === 0 ? (
            <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
              No assessments yet. Create your first firewall health check.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Critical</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments?.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{assessment.customerName} - {assessment.siteName}</TableCell>
                    <TableCell>{getVendorName(assessment.vendor)}</TableCell>
                    <TableCell>{assessment.model}</TableCell>
                    <TableCell>{getScoreBadge(assessment.overallScore)}</TableCell>
                    <TableCell>{assessment.stats.critical > 0 ? <Badge variant="destructive">{assessment.stats.critical}</Badge> : '-'}</TableCell>
                    <TableCell>
                      {assessment.status === 'draft' ? (
                        <Badge variant="outline">Draft</Badge>
                      ) : (
                        <Badge variant="secondary">Complete</Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(assessment.assessmentDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/firewall/${assessment.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
