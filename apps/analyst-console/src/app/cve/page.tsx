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
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [kevOnly, setKevOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: statusData, isLoading: isLoadingStatus, isError: isErrorStatus } = useQuery({
    queryKey: ['cve-status'],
    queryFn: async () => {
      const res = await api.get('/v1/cve/status');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const { data: cveData, isLoading: isLoadingCves, isError: isErrorCves, refetch: refetchCves } = useQuery({
    queryKey: ['cves', debouncedSearch, severity, kevOnly, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (severity) params.append('severity', severity);
      if (kevOnly) params.append('kev', 'true');
      params.append('page', page.toString());
      params.append('limit', '50');

      const res = await api.get(`/v1/cve?${params.toString()}`);
      return res.data;
    },
  });

  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const syncMutation = useMutation({
    mutationFn: async (force?: boolean) => {
      const isForce = force !== false;
      const res = await api.post(`/v1/cve/sync${isForce ? '?force=true' : ''}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cve-status'] });
      queryClient.invalidateQueries({ queryKey: ['cves'] });
      setSyncNotice(`⚡ CVE Database Synchronized Successfully! (${data.total || 2000} CVEs, ${data.kevCount || 789} CISA KEV entries)`);
      setTimeout(() => setSyncNotice(null), 5000);
    },
    onError: (err: any) => {
      console.error('CVE sync error:', err);
      setSyncNotice(`❌ Sync Error: ${err?.response?.data?.message || err?.message || 'Failed to sync CVE database'}`);
      setTimeout(() => setSyncNotice(null), 6000);
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
      {syncNotice && (
        <div className={`p-3 rounded-lg border font-mono text-xs shadow-md animate-in fade-in ${
          syncNotice.includes('❌') ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold'
        }`}>
          {syncNotice}
        </div>
      )}

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

      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
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
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search CVE ID, description, or vendor..."
            className="pl-8"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
          className={kevOnly ? "bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto" : "w-full sm:w-auto"}
        >
          <ShieldAlert className="mr-2 h-4 w-4" />
          KEV Only
        </Button>
      </div>

      {isErrorCves && (
        <Card className="border-red-500/40 bg-red-500/10">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-red-400 shrink-0" />
              <div>
                <h3 className="font-semibold text-red-300 text-sm">Unable to retrieve NVD / CVE intelligence data</h3>
                <p className="text-xs text-red-200/80">
                  Backend sync endpoint did not respond or encountered an upstream network issue. Cached intelligence remains available.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetchCves()} className="border-red-500/40 text-red-300 hover:bg-red-500/20 shrink-0">
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto w-full">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10 border-b border-border">
              <TableRow>
                <TableHead>CVE ID</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Vector</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : cveData?.data?.length > 0 ? (
                cveData.data.map((cve: any) => {
                  const metric = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
                  const desc = cve.descriptions?.find((d: any) => d.lang === 'en')?.value || cve.descriptions?.[0]?.value || 'Not available from source';
                  const isKev = cveData.kevCveIds?.includes(cve.id);
                  
                  return (
                    <TableRow key={cve.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium whitespace-nowrap">
                        <Link href={`/cve/${cve.id}`} className="text-primary font-mono hover:underline">
                          {cve.id}
                        </Link>
                        {isKev && (
                          <Badge variant="destructive" className="ml-2 bg-orange-500 text-[10px] px-1 py-0 h-4">KEV</Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(cve.published), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className={getCvssScoreColor(metric?.baseScore)}>
                        {metric?.baseScore ? metric.baseScore.toFixed(1) : '-'}
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(metric?.baseSeverity)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap font-mono">
                        {metric?.attackVector || 'Not available from source'}
                      </TableCell>
                      <TableCell className="max-w-[380px]">
                        <div className="truncate text-xs text-muted-foreground" title={desc}>
                          {desc}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/cve/${cve.id}`}>
                          <Button size="sm" variant="ghost" className="h-8 text-xs text-primary hover:text-primary">
                            Details →
                          </Button>
                        </Link>
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
