'use client';

import React, { useState } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { format } from 'date-fns';
import Link from 'next/link';
import { Shield, Search, Globe, Network, Server, Clock, AlertTriangle, AlertCircle, Database, ShieldAlert, Bot } from 'lucide-react';

export default function IpIntelligencePage() {
  const queryClient = useQueryClient();
  const [ipInput, setIpInput] = useState('');
  
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['ip-status'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/ip/status');
        return res.data;
      } catch {
        return { configured: false, total: 0 };
      }
    }
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['ip-history'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/ip/history');
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
      } catch {
        return [];
      }
    }
  });

  const lookupMutation = useMutation({
    mutationFn: async (ip: string) => {
      const res = await api.post('/v1/ip/lookup', { ip });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-history'] });
    }
  });

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput) return;
    lookupMutation.mutate(ipInput);
  };

  const investigationsList: any[] = Array.isArray(history) ? history : (history?.data || []);
  const maliciousCount = investigationsList.filter(inv => inv.threatClassification === 'malicious' || (inv.abuseScore || 0) >= 80).length;
  const suspiciousCount = investigationsList.filter(inv => inv.threatClassification === 'suspicious' || ((inv.abuseScore || 0) >= 40 && (inv.abuseScore || 0) < 80)).length;
  const torCount = investigationsList.filter(inv => (inv.isp || '').toLowerCase().includes('tor') || (inv.usageType || '').toLowerCase().includes('exit node')).length;

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <CyberPageHeader
        title="IP Threat Intelligence"
        description="Reputation analysis, ASN routing, AbuseIPDB integration, honeypot telemetry, and IP blacklist monitoring."
        breadcrumbs={[
          { label: 'CyberMind OS', href: '/dashboard' },
          { label: 'Threat Intelligence' },
          { label: 'IP Intelligence' },
        ]}
        badge={
          <Badge variant="outline" className="font-mono text-xs border-cyan-500/40 text-cyan-400 bg-cyan-500/10 font-bold">
            {status?.configured ? 'AbuseIPDB Integration Active' : 'Local Threat Store Ready'}
          </Badge>
        }
        actions={
          <Link href="/ip/blacklist">
            <Button size="sm" variant="outline" className="h-8 text-xs font-mono border-slate-700 hover:border-cyan-500/50">
              <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
              View IP Blacklist
            </Button>
          </Link>
        }
      />

      {/* 2. Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CyberMetric title="Total IP Lookups" value={status?.total ?? investigationsList.length} icon={<Globe className="w-4 h-4 text-cyan-400" />} />
        <CyberMetric title="Malicious IPs Identified" value={String(maliciousCount)} accentColor="red" />
        <CyberMetric title="Suspicious Threat IPs" value={String(suspiciousCount)} accentColor="orange" />
        <CyberMetric title="Tor / Anonymous Nodes" value={String(torCount)} accentColor="blue" />
      </div>

      {/* 3. IP Lookup Search Bar */}
      <CyberCard className="p-4">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input 
              placeholder="Enter IP address (e.g. 185.220.101.5 or IPv6)..." 
              value={ipInput} 
              onChange={(e) => setIpInput(e.target.value)}
              className="pl-9 h-10 bg-slate-900 border-slate-800 text-xs font-mono focus:border-cyan-500/50"
            />
          </div>
          <Button 
            type="submit" 
            disabled={lookupMutation.isPending || !ipInput}
            className="h-10 text-xs font-mono bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-6 shrink-0"
          >
            {lookupMutation.isPending ? 'Investigating IP...' : 'Investigate IP Address'}
          </Button>
        </form>
      </CyberCard>

      {/* 4. Investigation Result Card (If active) */}
      {lookupMutation.data && (
        <CyberCard className="p-6 space-y-4 font-mono text-xs border-cyan-500/40">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100">
              IP Threat Analysis Result — {lookupMutation.data.ip}
            </h3>
            <CyberSeverityBadge severity={lookupMutation.data.abuseScore >= 80 ? 'CRITICAL' : 'HIGH'} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-slate-500 text-[10px]">ABUSE CONFIDENCE SCORE</span>
              <div className="text-2xl font-bold text-red-400">{lookupMutation.data.abuseScore}%</div>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">COUNTRY & ISP</span>
              <div className="text-slate-200 font-bold">{lookupMutation.data.countryName || 'Germany'}</div>
              <div className="text-slate-400 text-[11px] truncate">{lookupMutation.data.isp || 'Tor Exit Node'}</div>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">DOMAIN</span>
              <div className="text-slate-200 font-bold">{lookupMutation.data.domain || 'N/A'}</div>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">USAGE TYPE</span>
              <div className="text-slate-200 font-bold">{lookupMutation.data.usageType || 'Data Center / Exit Node'}</div>
            </div>
          </div>
        </CyberCard>
      )}

      {/* 5. Investigation History Table */}
      <CyberCard className="overflow-hidden">
        <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between font-mono text-xs">
          <h3 className="font-bold text-slate-100 uppercase tracking-wider">Recent IP Investigations</h3>
        </div>

        <Table>
          <TableHeader className="bg-slate-900/40 border-b border-slate-800 font-mono text-xs">
            <TableRow className="border-slate-800">
              <TableHead>Target IP</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>ISP / Provider</TableHead>
              <TableHead>Abuse Score</TableHead>
              <TableHead>Threat Classification</TableHead>
              <TableHead>Investigated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-mono text-xs">
            {history && history.length > 0 ? (
              history.map((inv: any) => (
                <TableRow key={inv.id} className="border-slate-800/60 hover:bg-slate-900/60 transition-colors">
                  <TableCell className="font-bold text-cyan-400">{inv.ip}</TableCell>
                  <TableCell className="text-slate-300">{inv.countryName || 'Germany'}</TableCell>
                  <TableCell className="text-slate-400 max-w-[200px] truncate">{inv.isp}</TableCell>
                  <TableCell className="font-bold text-red-400">{inv.abuseScore}%</TableCell>
                  <TableCell>
                    <CyberSeverityBadge severity={inv.threatClassification === 'malicious' ? 'CRITICAL' : 'HIGH'} />
                  </TableCell>
                  <TableCell className="text-slate-500 text-[11px]">
                    {format(new Date(inv.investigatedAt), 'MMM dd HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => { setIpInput(inv.ip); lookupMutation.mutate(inv.ip); }}
                      className="h-7 text-[11px] font-mono border-slate-700 hover:bg-slate-800 text-cyan-400"
                    >
                      Re-Scan
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                  No IP investigations yet. Enter an IP above to begin.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CyberCard>
    </div>
  );
}
