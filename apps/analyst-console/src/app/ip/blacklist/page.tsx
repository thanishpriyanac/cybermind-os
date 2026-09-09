'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Download, Search, ShieldAlert, Globe, Server } from 'lucide-react';
import { format } from 'date-fns';

export default function IpBlacklistPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [minConfidence, setMinConfidence] = useState('25');

  const { data: blacklist, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ip-blacklist', minConfidence],
    queryFn: async () => {
      const res = await api.get(`/v1/ip/blacklist?confidenceMinimum=${minConfidence}`);
      return res.data;
    }
  });

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-red-500';
    if (score >= 70) return 'text-orange-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const filteredBlacklist = blacklist ? blacklist.filter((b: any) => 
    b.ipAddress.includes(searchTerm) || 
    (b.countryCode && b.countryCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (b.isp && b.isp.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  const handleExport = () => {
    if (!filteredBlacklist) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredBlacklist, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ip-blacklist-${format(new Date(), 'yyyyMMdd-HHmm')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const avgConfidence = blacklist && blacklist.length > 0
    ? Math.round(blacklist.reduce((acc: number, val: any) => acc + val.abuseConfidenceScore, 0) / blacklist.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">IP Blacklist</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading || isRefetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport} disabled={!blacklist || blacklist.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blacklisted IPs</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{blacklist?.length || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">
                <span className={getConfidenceColor(avgConfidence)}>{avgConfidence}</span><span className="text-sm text-muted-foreground font-normal">/100</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Filters</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{filteredBlacklist.length} <span className="text-sm text-muted-foreground font-normal">showing</span></div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
            <CardTitle>Blacklist Directory</CardTitle>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Min Confidence:</span>
                <select 
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(e.target.value)}
                >
                  <option value="25" className="bg-background">25+</option>
                  <option value="50" className="bg-background">50+</option>
                  <option value="75" className="bg-background">75+</option>
                  <option value="90" className="bg-background">90+</option>
                </select>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search IP or ISP..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>ISP</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Total Reports</TableHead>
                    <TableHead>Last Reported</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBlacklist && filteredBlacklist.length > 0 ? (
                    filteredBlacklist.slice(0, 100).map((entry: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono">{entry.ipAddress}</TableCell>
                        <TableCell>{entry.countryCode || 'N/A'}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={entry.isp}>{entry.isp || 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${getConfidenceColor(entry.abuseConfidenceScore)}`}>
                            {entry.abuseConfidenceScore}
                          </span>
                        </TableCell>
                        <TableCell>{entry.totalReportsNum}</TableCell>
                        <TableCell>{entry.lastReportedAt ? format(new Date(entry.lastReportedAt), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No IPs match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          {filteredBlacklist.length > 100 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Showing first 100 of {filteredBlacklist.length} results. Use search or export to see more.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
