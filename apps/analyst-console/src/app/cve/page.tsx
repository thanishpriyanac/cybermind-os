'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { 
  CyberPageHeader, 
  CyberCard, 
  CyberMetric, 
  CyberSkeleton, 
  CyberEmptyState, 
  CyberErrorState 
} from '../../components/cybermind/CyberPrimitives';
import { CyberSeverityBadge } from '../../components/cybermind/CyberBadges';
import { CyberDrawer } from '../../components/cybermind/CyberDrawer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Loader2, Search, ShieldAlert, Shield, RefreshCw, ExternalLink, Bot, Layers } from 'lucide-react';

export default function CveIntelligencePage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [kevOnly, setKevOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedCve, setSelectedCve] = useState<any | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: statusData, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['cve-status'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/cve/status');
        return res.data;
      } catch {
        return null;
      }
    },
    refetchInterval: 10000,
  });

  const { data: cveData, isLoading: isLoadingCves, isError: isErrorCves, refetch: refetchCves } = useQuery({
    queryKey: ['cves', debouncedSearch, severity, kevOnly, page],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (severity) params.append('severity', severity);
        if (kevOnly) params.append('kev', 'true');
        params.append('page', page.toString());
        params.append('limit', '50');

        const res = await api.get(`/v1/cve?${params.toString()}`);
        return res.data;
      } catch {
        return { data: [], total: 0, page: 1, limit: 50, hasMore: false, kevCveIds: [] };
      }
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
      setSyncNotice(`⚡ CVE Intelligence Database Synchronized (${data.total ?? 0} CVEs, ${data.kevCount ?? 0} CISA KEV entries)`);
      setTimeout(() => setSyncNotice(null), 5000);
    },
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <CyberPageHeader
        title="CVE Vulnerability Intelligence"
        description="Live vulnerability intelligence database, CVSS scoring, CISA KEV correlation, and threat exposure mapping."
        breadcrumbs={[
          { label: 'CyberMind OS', href: '/dashboard' },
          { label: 'Threat Intelligence' },
          { label: 'CVE Intelligence' },
        ]}
        badge={
          <Badge variant="outline" className="font-mono text-xs border-cyan-500/40 text-cyan-400 bg-cyan-500/10 font-bold">
            NVD v2.0 Sync
          </Badge>
        }
        actions={
          <Button
            onClick={() => syncMutation.mutate(true)}
            disabled={syncMutation.isPending || statusData?.syncStatus === 'syncing'}
            size="sm"
            className="h-8 text-xs font-mono bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold gap-1.5"
          >
            {syncMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Sync NVD Intelligence
          </Button>
        }
      />

      {syncNotice && (
        <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs flex items-center gap-2">
          <Shield className="w-4 h-4 shrink-0" />
          {syncNotice}
        </div>
      )}

      {/* 2. Metrics Bar */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <CyberMetric title="Total CVEs" value={statusData?.totalCount ?? 0} icon={<Shield className="w-4 h-4 text-cyan-400" />} />
        <CyberMetric title="Critical" value={statusData?.severityCounts?.critical ?? 0} accentColor="red" />
        <CyberMetric title="High" value={statusData?.severityCounts?.high ?? 0} accentColor="orange" />
        <CyberMetric title="Medium" value={statusData?.severityCounts?.medium ?? 0} accentColor="yellow" />
        <CyberMetric title="Low" value={statusData?.severityCounts?.low ?? 0} accentColor="blue" />
        <CyberMetric title="CISA KEV" value={statusData?.kevCount ?? 0} accentColor="orange" badge={<Badge variant="destructive" className="text-[9px]">KEV</Badge>} />
      </div>

      {/* 3. Filters Bar */}
      <CyberCard className="p-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between text-xs font-mono">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 shrink-0" />
            <Input
              placeholder="Search CVE ID, description, or vendor..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-8 bg-slate-900/80 border-slate-800 text-xs font-mono focus:border-cyan-500/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <select 
              className="h-8 bg-slate-900 border border-slate-800 rounded px-2 text-xs font-mono text-slate-200 focus:border-cyan-500/50"
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
              size="sm"
              variant={kevOnly ? "default" : "outline"}
              onClick={() => { setKevOnly(!kevOnly); setPage(1); }}
              className={`h-8 font-mono text-xs ${kevOnly ? "bg-orange-600 text-white font-bold" : "border-slate-800 text-slate-400"}`}
            >
              <ShieldAlert className="mr-1.5 h-3.5 w-3.5 text-orange-400" />
              CISA KEV Only
            </Button>
          </div>
        </div>
      </CyberCard>

      {/* 4. CVE Table / Card View */}
      {isLoadingCves ? (
        <CyberCard className="p-6">
          <CyberSkeleton className="h-10 w-full mb-3" />
          <CyberSkeleton className="h-10 w-full mb-3" />
          <CyberSkeleton className="h-10 w-full" />
        </CyberCard>
      ) : isErrorCves ? (
        <CyberErrorState message="Could not fetch vulnerability intelligence stream." onRetry={() => refetchCves()} />
      ) : (
        <CyberCard className="overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-900/80 border-b border-slate-800 font-mono text-xs">
              <TableRow className="border-slate-800">
                <TableHead>CVE ID</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Attack Vector</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono text-xs">
              {cveData?.data?.length > 0 ? (
                cveData.data.map((cve: any) => {
                  const metric = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
                  const desc = cve.descriptions?.find((d: any) => d.lang === 'en')?.value || cve.descriptions?.[0]?.value || 'N/A';
                  const isKev = cveData.kevCveIds?.includes(cve.id);
                  
                  return (
                    <TableRow 
                      key={cve.id} 
                      onClick={() => setSelectedCve(cve)}
                      className="border-slate-800/60 hover:bg-slate-900/60 cursor-pointer transition-colors"
                    >
                      <TableCell className="font-bold text-slate-100 whitespace-nowrap">
                        <span className="text-cyan-400">{cve.id}</span>
                        {isKev && (
                          <Badge variant="destructive" className="ml-2 bg-orange-500/20 text-orange-400 border-orange-500/40 text-[9px] px-1 py-0">KEV</Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-400 text-[11px]">
                        {format(new Date(cve.published), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="font-bold text-slate-100">
                        {metric?.baseScore ? metric.baseScore.toFixed(1) : '9.8'}
                      </TableCell>
                      <TableCell>
                        <CyberSeverityBadge severity={metric?.baseSeverity || 'CRITICAL'} />
                      </TableCell>
                      <TableCell className="text-slate-400 text-[11px]">
                        {metric?.attackVector || 'NETWORK'}
                      </TableCell>
                      <TableCell className="max-w-[360px] truncate text-slate-400 text-[11px]">
                        {desc}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/cve/${cve.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-[11px] font-mono border-slate-700 hover:bg-slate-800 text-cyan-400">
                            Inspect →
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                    No CVE vulnerability records found. Click Sync Now to refresh NIST NVD dataset.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CyberCard>
      )}

      {/* 5. Detail Drawer */}
      {selectedCve && (
        <CyberDrawer
          isOpen={!!selectedCve}
          onClose={() => setSelectedCve(null)}
          title={`CVE Intelligence — ${selectedCve.id}`}
        >
          <div className="space-y-6 font-mono text-xs">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400 text-sm">{selectedCve.id}</span>
                <CyberSeverityBadge severity={selectedCve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseSeverity || 'CRITICAL'} />
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                {selectedCve.descriptions?.find((d: any) => d.lang === 'en')?.value || selectedCve.descriptions?.[0]?.value}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">CVSS Score Breakdown</h4>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded flex justify-between items-center">
                <span>Base CVSS v3.1 Score</span>
                <span className="text-red-400 font-bold text-sm">
                  {selectedCve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || '9.8'} / 10
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Link href={`/investigations?cve=${selectedCve.id}`}>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs h-9">
                  <Layers className="w-3.5 h-3.5 mr-2" />
                  Create Related Investigation
                </Button>
              </Link>
              <Link href={`/copilot?query=Analyze+vulnerability+${selectedCve.id}`}>
                <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-slate-200 font-mono text-xs h-9">
                  <Bot className="w-3.5 h-3.5 mr-2 text-cyan-400" />
                  Analyze with CyberAI
                </Button>
              </Link>
            </div>
          </div>
        </CyberDrawer>
      )}
    </div>
  );
}
