'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { format } from 'date-fns';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  Globe, 
  Server, 
  Cloud, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Lock, 
  Activity,
  Layers
} from 'lucide-react';

export default function VaptDashboardPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('ALL');

  const { data: vaptData, isLoading, isError, refetch } = useQuery({
    queryKey: ['vapt-assessments'],
    queryFn: async () => {
      const res = await api.get('/v1/vapt/assessments');
      return res.data;
    },
  });

  const assessments = vaptData?.data || [];

  const filteredAssessments = assessments.filter((a: any) => {
    const matchesSearch = 
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.target.toLowerCase().includes(search.toLowerCase()) ||
      a.authorization?.reference?.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = targetTypeFilter === 'ALL' || a.targetType === targetTypeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate summary metrics
  const totalAssessments = assessments.length;
  const criticalFindings = assessments.reduce((acc: number, a: any) => acc + (a.findingsCount?.critical || 0), 0);
  const highFindings = assessments.reduce((acc: number, a: any) => acc + (a.findingsCount?.high || 0), 0);
  const owaspTotal = assessments.reduce((acc: number, a: any) => acc + (a.findingsCount?.total || 0), 0);

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'web_app': return <Globe className="h-4 w-4 text-cyan-400" />;
      case 'api': return <Layers className="h-4 w-4 text-purple-400" />;
      case 'network': return <Server className="h-4 w-4 text-emerald-400" />;
      case 'cloud': return <Cloud className="h-4 w-4 text-amber-400" />;
      default: return <Globe className="h-4 w-4 text-cyan-400" />;
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) return <Badge variant="destructive" className="bg-red-600 font-bold font-mono">Critical ({score})</Badge>;
    if (score >= 60) return <Badge variant="destructive" className="bg-orange-500 font-bold font-mono">High ({score})</Badge>;
    if (score >= 40) return <Badge variant="secondary" className="bg-yellow-500 text-black font-bold font-mono">Medium ({score})</Badge>;
    return <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 font-mono">Low ({score})</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary animate-pulse" />
            VAPT Security Assessment & Audit Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Authorization-first vulnerability scanning, OWASP Top 10 analysis, redacted evidence, and CVE correlation.
          </p>
        </div>
        <Link href="/vapt/new">
          <Button className="bg-primary hover:bg-primary/90 font-semibold gap-2 shadow-lg">
            <Plus className="h-4 w-4" /> New Authorized Assessment
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
            <Activity className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold font-mono">{totalAssessments}</div>}
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-400">Critical Risk Findings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold font-mono text-red-400">{criticalFindings}</div>}
          </CardContent>
        </Card>

        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-400">High Risk Vulnerabilities</CardTitle>
            <ShieldAlert className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold font-mono text-orange-400">{highFindings}</div>}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">OWASP Top 10 Issues</CardTitle>
            <FileText className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold font-mono">{owaspTotal}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by assessment target, authorization reference, or name..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'web_app', 'api', 'network', 'cloud'].map((type) => (
            <Button
              key={type}
              variant={targetTypeFilter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTargetTypeFilter(type)}
              className="text-xs uppercase font-mono whitespace-nowrap"
            >
              {type === 'ALL' ? 'All Scopes' : type.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* VAPT Data Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10 border-b border-border">
              <TableRow>
                <TableHead>Target & Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Authorization</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>OWASP Findings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredAssessments.length > 0 ? (
                filteredAssessments.map((a: any) => (
                  <TableRow key={a.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">
                      <Link href={`/vapt/${a.id}`} className="text-primary hover:underline font-semibold block">
                        {a.name}
                      </Link>
                      <span className="text-xs text-muted-foreground font-mono">{a.target}</span>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 text-xs w-fit">
                        {getTargetIcon(a.targetType)}
                        <span className="capitalize">{a.targetType?.replace('_', ' ')}</span>
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <Lock className="h-3.5 w-3.5 shrink-0" />
                        <span>{a.authorization?.reference || 'AUTH-OK'}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {getRiskBadge(a.overallRiskScore || 0)}
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="flex gap-1.5 items-center font-mono">
                        {a.findingsCount?.critical > 0 && <span className="text-red-400 font-bold">{a.findingsCount.critical} Crit</span>}
                        {a.findingsCount?.high > 0 && <span className="text-orange-400 font-bold">{a.findingsCount.high} High</span>}
                        {a.findingsCount?.medium > 0 && <span className="text-yellow-400">{a.findingsCount.medium} Med</span>}
                        {a.findingsCount?.total === 0 && <span className="text-muted-foreground">0 Findings</span>}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge className={
                        a.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        a.status === 'RUNNING' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse' :
                        'bg-muted text-muted-foreground'
                      }>
                        {a.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {a.environment === 'DEMO' ? (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px]">DEMO</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-[10px]">PRODUCTION</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Link href={`/vapt/${a.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 text-xs text-primary hover:text-primary">
                          Audit Report →
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No VAPT assessments found. Click &quot;New Authorized Assessment&quot; to launch target testing.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
