'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { format } from 'date-fns';
import { Skeleton } from '../../components/ui/skeleton';
import Link from 'next/link';
import {
  FileText,
  Download,
  Plus,
  Search,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

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
      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (searchQuery) params.append('search', searchQuery);
      const res = await api.get(`/v1/qbr?${params.toString()}`);
      return res.data.data as QbrReport[];
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

  // Calculate Summary KPI Stats
  const totalCount = reports?.length || 0;
  const avgScore = reports && reports.length > 0
    ? Math.round(reports.reduce((acc, r) => acc + (r.overallScore || 0), 0) / reports.length)
    : 0;
  const finalizedCount = reports?.filter((r) => r.status === 'FINALIZED').length || 0;
  const pendingCount = reports?.filter((r) => r.status === 'DRAFT' || r.status === 'IN_REVIEW').length || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Executive QBR Assessment Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automated Quarterly Business Review (QBR) executive security briefing synthesis & posture auditing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsGenerating(!isGenerating)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate New QBR Report
          </Button>
        </div>
      </div>

      {/* Quick Generator Panel */}
      {isGenerating && (
        <Card className="border-primary/40 bg-card/90 backdrop-blur shadow-lg animate-in fade-in slide-in-from-top-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Synthesize Executive QBR Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a comprehensive CISO assessment brief compiling perimeter security posture, CIS FortiGate benchmark results, and prioritized remediation actions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Enterprise Customer Name (e.g. Acme Corp)"
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                className="flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                disabled={generateMutation.isPending}
                onClick={() => generateMutation.mutate(customerNameInput)}
                className="bg-primary text-primary-foreground"
              >
                {generateMutation.isPending ? 'Synthesizing Report...' : 'Run Executive Generator'}
              </Button>
              <Button variant="ghost" onClick={() => setIsGenerating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Executive KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Reports</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{totalCount}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Compliance Score</p>
              <h3 className={`text-2xl font-bold mt-1 ${avgScore >= 80 ? 'text-green-500' : avgScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                {avgScore}/100
              </h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Finalized Reports</p>
              <h3 className="text-2xl font-bold text-green-400 mt-1">{finalizedCount}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Review</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-border">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
            {['ALL', 'DRAFT', 'GENERATED', 'IN_REVIEW', 'FINALIZED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedStatus === st
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customer, ID, vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-input rounded-md pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">QBR Executive Reports Matrix</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto w-full p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[140px]">Report ID</TableHead>
                  <TableHead>Customer & Site</TableHead>
                  <TableHead>Appliance / Vendor</TableHead>
                  <TableHead className="text-center">Compliance Score</TableHead>
                  <TableHead className="text-center">Risk Level</TableHead>
                  <TableHead>Report Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports && reports.length > 0 ? (
                  reports.map((r) => {
                    let statusVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
                    let statusClass = '';
                    if (r.status === 'FINALIZED') {
                      statusClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                    } else if (r.status === 'IN_REVIEW') {
                      statusClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    } else if (r.status === 'GENERATED') {
                      statusClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                    } else {
                      statusClass = 'bg-muted text-muted-foreground border-border';
                    }

                    return (
                      <TableRow key={r.id} className="border-border hover:bg-muted/50">
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {r.assessmentNumber || r.id}
                        </TableCell>

                        <TableCell>
                          <div className="font-semibold text-foreground text-sm">{r.customerName}</div>
                          <div className="text-xs text-muted-foreground">{r.siteName || 'HQ Node'}</div>
                        </TableCell>

                        <TableCell>
                          <div className="font-medium text-xs capitalize text-foreground">
                            {r.vendor} {r.model}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{r.preparedBy}</div>
                        </TableCell>

                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              r.overallScore >= 80
                                ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                                : r.overallScore >= 60
                                ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                                : 'bg-red-500/15 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {r.overallScore}%
                          </span>
                        </TableCell>

                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                              r.overallRisk === 'CRITICAL'
                                ? 'bg-red-600/20 text-red-500'
                                : r.overallRisk === 'HIGH'
                                ? 'bg-orange-500/20 text-orange-400'
                                : r.overallRisk === 'MEDIUM'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {r.overallRisk || 'LOW'}
                          </span>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {r.reportDate ? format(new Date(r.reportDate), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>

                        <TableCell>
                          <Badge variant={statusVariant} className={`capitalize text-[11px] font-semibold ${statusClass}`}>
                            {r.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right pr-6 space-x-2">
                          <Link href={`/qbr/${r.id}`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                              <FileText className="w-3.5 h-3.5 mr-1.5 text-primary" />
                              View Brief
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => window.open(`/api/v1/qbr/generate`, '_blank')}
                            title="Export HTML Format"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No QBR Executive Reports found matching criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
