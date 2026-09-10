'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Loader2, Search, ShieldAlert, Shield } from 'lucide-react';

export default function CveIntelligencePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [kevOnly, setKevOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data: statusData, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['cve-status'],
    queryFn: async () => {
      const res = await api.get('/v1/cve/status');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const { data: cveData, isLoading: isLoadingCves } = useQuery({
    queryKey: ['cves', search, severity, kevOnly, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (severity) params.append('severity', severity);
      if (kevOnly) params.append('kev', 'true');
      params.append('page', page.toString());
      params.append('limit', '50');

      const res = await api.get(`/v1/cve?${params.toString()}`);
      return res.data;
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (force?: boolean) => {
      const isForce = force !== false;
      const res = await api.post(`/v1/cve/sync${isForce ? '?force=true' : ''}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cve-status'] });
      queryClient.invalidateQueries({ queryKey: ['cves'] });
    },
  });

  // Auto-trigger sync on first load or every 1 hour (3600000 ms)
  useEffect(() => {
    if (!statusData) return;

    const lastSyncTime = statusData.lastNvdSync ? new Date(statusData.lastNvdSync).getTime() : 0;
    const isMoreThan1HourOld = Date.now() - lastSyncTime > 60 * 60 * 1000;

    if (
      (statusData.totalCount === 0 || isMoreThan1HourOld) &&
      !syncMutation.isPending &&
      statusData.syncStatus !== 'syncing'
    ) {
      syncMutation.mutate(true);
    }
  }, [statusData]);

  // Set up 1-hour interval timer (3600000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      syncMutation.mutate(true);
    }, 60 * 60 * 1000); // Auto-sync every 1 hour

    return () => clearInterval(interval);
  }, []);

  const getSeverityBadge = (s?: string) => {
    if (!s) return <Badge variant="outline">Unknown</Badge>;
    switch (s.toLowerCase()) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge variant="destructive" className="bg-orange-500">High</Badge>;
      case 'medium': return <Badge variant="secondary" className="bg-yellow-500 text-black">Medium</Badge>;
      case 'low': return <Badge variant="outline">Low</Badge>;
      default: return <Badge>{s}</Badge>;
    }
  };

  const getCvssScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 9) return 'text-red-500 font-bold';
    if (score >= 7) return 'text-orange-500 font-bold';
    if (score >= 4) return 'text-yellow-500 font-bold';
    return 'text-blue-500 font-bold';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">CVE Intelligence</h1>
        <Button 
          onClick={() => syncMutation.mutate(true)} 
          disabled={syncMutation.isPending || statusData?.syncStatus === 'syncing'}
        >
          {(syncMutation.isPending || statusData?.syncStatus === 'syncing') && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Sync Now
        </Button>
      </div>

      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3 font-mono bg-muted/40 p-2.5 rounded-md border border-border">
        <span>Last synced: <strong className="text-foreground">{statusData?.lastNvdSync ? formatDistanceToNow(new Date(statusData.lastNvdSync)) + ' ago' : 'Just now'}</strong></span>
        <span>•</span>
        <span className="flex items-center gap-1.5">
          Status: 
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
            ● OK (Up to Date)
          </Badge>
        </span>
        <span>•</span>
        <span className="text-cyan-400">⚡ Auto-Sync Schedule: Every 1 Hour</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total CVEs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStatus ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{statusData?.totalCount || 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <div className="h-4 w-4 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStatus ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{statusData?.severityCounts?.critical || 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High</CardTitle>
            <div className="h-4 w-4 rounded-full bg-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStatus ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{statusData?.severityCounts?.high || 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium</CardTitle>
            <div className="h-4 w-4 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStatus ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{statusData?.severityCounts?.medium || 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStatus ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{statusData?.severityCounts?.low || 0}</div>}
          </CardContent>
        </Card>
        <Card className="border-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-500">CISA KEV</CardTitle>
            <ShieldAlert className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStatus ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-orange-500">{statusData?.kevCount || 0}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search CVE ID or description..."
            className="pl-8"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select 
          className="flex h-10 w-full md:w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={severity}
          onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <Button 
          variant={kevOnly ? "default" : "outline"}
          onClick={() => { setKevOnly(!kevOnly); setPage(1); }}
          className={kevOnly ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
        >
          <ShieldAlert className="mr-2 h-4 w-4" />
          KEV Only
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CVE ID</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Vector</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingCves ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full max-w-[300px]" /></TableCell>
                  </TableRow>
                ))
              ) : cveData?.data?.length > 0 ? (
                cveData.data.map((cve: any) => {
                  const metric = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
                  const desc = cve.descriptions?.find((d: any) => d.lang === 'en')?.value || cve.descriptions?.[0]?.value || '';
                  const isKev = cveData.kevCveIds?.includes(cve.id);
                  
                  return (
                    <TableRow key={cve.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <Link href={`/cve/${cve.id}`} className="text-primary hover:underline">
                          {cve.id}
                        </Link>
                        {isKev && (
                          <Badge variant="destructive" className="ml-2 bg-orange-500 text-[10px] px-1 py-0 h-4">KEV</Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(cve.published), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className={getCvssScoreColor(metric?.baseScore)}>
                        {metric?.baseScore?.toFixed(1) || '-'}
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(metric?.baseSeverity)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {metric?.attackVector || '-'}
                      </TableCell>
                      <TableCell className="max-w-[400px]">
                        <div className="truncate" title={desc}>
                          {desc}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No CVEs found. Click Sync Now to fetch latest vulnerability data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {cveData?.data?.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((cveData.page - 1) * cveData.limit) + 1} to {Math.min(cveData.page * cveData.limit, cveData.total)} of {cveData.total}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!cveData.hasMore}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
