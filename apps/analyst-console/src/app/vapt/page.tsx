'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { VaptPageHeader } from '../../components/vapt/VaptPageHeader';
import { VaptSummaryCard } from '../../components/vapt/VaptSummaryCard';
import { VaptFilterBar } from '../../components/vapt/VaptFilterBar';
import { VaptAssessmentTable } from '../../components/vapt/VaptAssessmentTable';
import { VaptEmptyState } from '../../components/vapt/VaptEmptyState';
import { VaptErrorState } from '../../components/vapt/VaptErrorState';

export default function VaptDashboardPage() {
  const [search, setSearch] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const { data: vaptData, isLoading, isError, refetch } = useQuery({
    queryKey: ['vapt-assessments'],
    queryFn: async () => {
      const res = await api.get('/v1/vapt/assessments');
      return res.data;
    },
    staleTime: 10000,
  });

  const assessments = vaptData?.data || [];

  const filteredAssessments = assessments.filter((a: any) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      a.name?.toLowerCase().includes(q) ||
      a.target?.toLowerCase().includes(q) ||
      a.authorization?.reference?.toLowerCase().includes(q);

    const matchesType = targetTypeFilter === 'ALL' || a.targetType === targetTypeFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status?.toUpperCase() === statusFilter;

    let matchesRisk = true;
    const score = a.overallRiskScore || 0;
    if (riskFilter === 'CRITICAL') matchesRisk = score >= 80;
    else if (riskFilter === 'HIGH') matchesRisk = score >= 60 && score < 80;
    else if (riskFilter === 'MEDIUM') matchesRisk = score >= 40 && score < 60;
    else if (riskFilter === 'LOW') matchesRisk = score < 40;

    return matchesSearch && matchesType && matchesStatus && matchesRisk;
  });

  // Calculate summary metrics
  const totalAssessments = assessments.length;
  const criticalFindings = assessments.reduce((acc: number, a: any) => acc + (a.findingsCount?.critical || 0), 0);
  const highFindings = assessments.reduce((acc: number, a: any) => acc + (a.findingsCount?.high || 0), 0);
  const openFindings = assessments.reduce((acc: number, a: any) => acc + (a.findingsCount?.total || 0), 0);

  const clearFilters = () => {
    setSearch('');
    setTargetTypeFilter('ALL');
    setStatusFilter('ALL');
    setRiskFilter('ALL');
  };

  if (isError) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <VaptPageHeader
          title="VAPT Security Assessment & Audit Engine"
          subtitle="Authorization-first vulnerability management and OWASP analysis."
        />
        <VaptErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <VaptPageHeader
        title="VAPT Security Assessment Engine"
        subtitle="Authorization-first vulnerability scanning, OWASP Top 10 analysis, redacted evidence, and CVE correlation."
        actions={
          <Link href="/vapt/new">
            <Button className="bg-primary hover:bg-primary/90 text-black font-extrabold text-xs h-10 px-4 gap-2 shadow-md">
              <Plus className="h-4 w-4" />
              <span>New Authorized Assessment</span>
            </Button>
          </Link>
        }
      />

      {/* Summary Risk Cards */}
      <VaptSummaryCard
        totalAssessments={totalAssessments}
        criticalFindings={criticalFindings}
        highFindings={highFindings}
        openFindings={openFindings}
        isLoading={isLoading}
      />

      {/* Filter Bar (Desktop Inline & Mobile Bottom Sheet) */}
      <VaptFilterBar
        search={search}
        onSearchChange={setSearch}
        targetTypeFilter={targetTypeFilter}
        onTargetTypeChange={setTargetTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        riskFilter={riskFilter}
        onRiskChange={setRiskFilter}
        onClearFilters={clearFilters}
      />

      {/* Assessment List: Desktop Table + Mobile Cards */}
      {!isLoading && assessments.length === 0 ? (
        <VaptEmptyState />
      ) : (
        <VaptAssessmentTable
          assessments={filteredAssessments}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
