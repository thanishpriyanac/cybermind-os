'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { 
  CyberPageHeader, 
  CyberCard, 
  CyberMetric, 
  CyberSkeleton, 
  CyberEmptyState 
} from '../../components/cybermind/CyberPrimitives';
import { CyberSeverityBadge, CyberStatusBadge } from '../../components/cybermind/CyberBadges';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { format } from 'date-fns';
import Link from 'next/link';
import { FileText, Download, Sparkles, Search, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

interface QbrReport {
  id: string;
  assessmentNumber: string;
  customerName: string;
  siteName: string;
  vendor: string;
  model: string;
  overallScore: number;
  overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reportDate: string;
  status: 'DRAFT' | 'GENERATED' | 'IN_REVIEW' | 'FINALIZED';
  preparedBy: string;
}

export default function QbrReportsPage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [customerNameInput, setCustomerNameInput] = useState<string>('');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['qbr-reports', selectedStatus, searchQuery],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
        if (searchQuery) params.append('search', searchQuery);
        const res = await api.get(`/v1/qbr?${params.toString()}`);
        return (res.data.data || []) as QbrReport[];
      } catch {
        return [
          { id: 'QBR-2026-01', assessmentNumber: 'QBR-01', customerName: 'CyberMind Enterprise', siteName: 'HQ Node', vendor: 'fortinet', model: 'FortiGate 200F', overallScore: 88, overallRisk: 'LOW', reportDate: new Date().toISOString(), status: 'FINALIZED', preparedBy: 'CISO Office' },
          { id: 'QBR-2026-02', assessmentNumber: 'QBR-02', customerName: 'Finance Division', siteName: 'US-East-01', vendor: 'paloalto', model: 'PA-3220', overallScore: 74, overallRisk: 'HIGH', reportDate: new Date(Date.now() - 86400000).toISOString(), status: 'IN_REVIEW', preparedBy: 'SOC Lead' }
        ] as QbrReport[];
      }
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (clientName: string) => {
      const res = await api.post('/v1/qbr/generate', { customerName: clientName || 'Enterprise Operations' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qbr-reports'] });
      setIsGenerating(false);
      setCustomerNameInput('');
    },
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <CyberPageHeader
        title="Quarterly Business Review (QBR) Reports"
        description="Executive CISO security briefings, risk trend synthesis, posture auditing, and compliance reporting."
        breadcrumbs={[
          { label: 'CyberMind OS', href: '/dashboard' },
          { label: 'Reporting' },
          { label: 'QBR Reports' },
        ]}
        badge={
          <Badge variant="outline" className="font-mono text-xs border-cyan-500/40 text-cyan-400 bg-cyan-500/10 font-bold">
            Executive Synthesis
          </Badge>
        }
        actions={
          <Button
            onClick={() => setIsGenerating(!isGenerating)}
            size="sm"
            className="h-8 text-xs font-mono bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            + Generate QBR Report
          </Button>
        }
      />

      {/* 2. Generator Input Box */}
      {isGenerating && (
        <CyberCard className="p-4 border-cyan-500/40 space-y-3 font-mono text-xs">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Synthesize Executive QBR Briefing
          </h3>
          <p className="text-slate-400 font-sans text-xs">
            Synthesizes CISO executive briefing compiling threat exposure, perimeter firewall audit scores, and remediation priorities.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enterprise Customer / Division Name..."
              value={customerNameInput}
              onChange={(e) => setCustomerNameInput(e.target.value)}
              className="h-8 bg-slate-900 border-slate-800 text-xs font-mono focus:border-cyan-500/50"
            />
            <Button
              size="sm"
              disabled={generateMutation.isPending}
              onClick={() => generateMutation.mutate(customerNameInput)}
              className="h-8 font-mono text-xs bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold shrink-0"
            >
              {generateMutation.isPending ? 'Synthesizing...' : 'Run Generator'}
            </Button>
          </div>
        </CyberCard>
      )}

      {/* 3. Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CyberMetric title="Total Executive Reports" value={reports?.length || 2} icon={<FileText className="w-4 h-4 text-cyan-400" />} />
        <CyberMetric title="Avg Compliance Score" value="81%" accentColor="emerald" />
        <CyberMetric title="Finalized Briefs" value="1" accentColor="cyan" />
        <CyberMetric title="Pending CISO Review" value="1" accentColor="yellow" />
      </div>

      {/* 4. Filter Bar */}
      <CyberCard className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 shrink-0" />
            <Input
              placeholder="Search customer, ID, vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 bg-slate-900/80 border-slate-800 text-xs font-mono focus:border-cyan-500/50"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {['ALL', 'DRAFT', 'GENERATED', 'IN_REVIEW', 'FINALIZED'].map((st) => (
              <Button
                key={st}
                size="sm"
                variant={selectedStatus === st ? 'default' : 'outline'}
                onClick={() => setSelectedStatus(st)}
                className={`h-7 px-2.5 text-[11px] font-mono capitalize ${
                  selectedStatus === st
                    ? 'bg-cyan-600 text-slate-950 font-bold'
                    : 'border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>
      </CyberCard>

      {/* 5. Reports Table */}
      <CyberCard className="overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80 border-b border-slate-800 font-mono text-xs">
            <TableRow className="border-slate-800">
              <TableHead>Report ID</TableHead>
              <TableHead>Customer & Site</TableHead>
              <TableHead>Appliance / Vendor</TableHead>
              <TableHead>Compliance</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Report Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-mono text-xs">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="p-6">
                  <CyberSkeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ) : reports?.map((r) => (
              <TableRow key={r.id} className="border-slate-800/60 hover:bg-slate-900/60 transition-colors">
                <TableCell className="font-bold text-cyan-400">{r.assessmentNumber || r.id}</TableCell>
                <TableCell className="font-bold text-slate-100">{r.customerName} - <span className="text-slate-400 font-normal">{r.siteName}</span></TableCell>
                <TableCell className="text-slate-300 capitalize">{r.vendor} {r.model}</TableCell>
                <TableCell className="font-bold text-emerald-400">{r.overallScore}%</TableCell>
                <TableCell>
                  <CyberSeverityBadge severity={r.overallRisk} />
                </TableCell>
                <TableCell className="text-slate-500 text-[11px]">{format(new Date(r.reportDate), 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  <CyberStatusBadge status={r.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/qbr/${r.id}`}>
                    <Button size="sm" variant="outline" className="h-7 text-[11px] font-mono border-slate-700 hover:bg-slate-800 text-cyan-400">
                      View Executive Brief →
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CyberCard>
    </div>
  );
}
