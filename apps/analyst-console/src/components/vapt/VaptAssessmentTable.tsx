'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { VaptRiskBadge, VaptStatusBadge } from './VaptBadges';
import { VaptAssessmentCard, AssessmentItem } from './VaptAssessmentCard';
import { Lock, Globe, Server, Cloud, Layers, ChevronRight, ShieldAlert } from 'lucide-react';

export interface VaptAssessmentTableProps {
  assessments: AssessmentItem[];
  isLoading?: boolean;
}

export function VaptAssessmentTable({ assessments, isLoading = false }: VaptAssessmentTableProps) {
  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'web_app': return <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />;
      case 'api': return <Layers className="h-3.5 w-3.5 text-purple-400 shrink-0" />;
      case 'network': return <Server className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
      case 'cloud': return <Cloud className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
      default: return <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />;
    }
  };

  return (
    <>
      {/* Mobile Card Layout (< 768px md breakpoint) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))
        ) : assessments.length > 0 ? (
          assessments.map((a) => <VaptAssessmentCard key={a.id} assessment={a} />)
        ) : (
          <Card className="p-8 text-center text-muted-foreground text-xs font-mono">
            No VAPT assessments found matching filter.
          </Card>
        )}
      </div>

      {/* Desktop / Laptop Table Layout (>= 768px md breakpoint) */}
      <div className="hidden md:block">
        <Card className="border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-md z-10 border-b border-border">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-mono text-xs uppercase">Target & Assessment</TableHead>
                    <TableHead className="font-mono text-xs uppercase">Type</TableHead>
                    <TableHead className="font-mono text-xs uppercase">Authorization</TableHead>
                    <TableHead className="font-mono text-xs uppercase">Overall Risk</TableHead>
                    <TableHead className="font-mono text-xs uppercase">OWASP Findings</TableHead>
                    <TableHead className="font-mono text-xs uppercase">Status</TableHead>
                    <TableHead className="font-mono text-xs uppercase">Environment</TableHead>
                    <TableHead className="font-mono text-xs uppercase text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : assessments.length > 0 ? (
                    assessments.map((a) => (
                      <TableRow key={a.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium">
                          <Link href={`/vapt/${a.id}`} className="text-primary hover:underline font-bold block text-sm">
                            {a.name}
                          </Link>
                          <span className="text-xs text-muted-foreground font-mono">{a.target}</span>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1.5 text-xs w-fit font-mono py-1">
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
                          <VaptRiskBadge score={a.overallRiskScore || 0} />
                        </TableCell>

                        <TableCell className="text-xs font-mono">
                          <div className="flex gap-1.5 items-center">
                            {(a.findingsCount?.critical || 0) > 0 && (
                              <span className="text-red-400 font-bold">{a.findingsCount.critical} Crit</span>
                            )}
                            {(a.findingsCount?.high || 0) > 0 && (
                              <span className="text-orange-400 font-bold">{a.findingsCount.high} High</span>
                            )}
                            {(a.findingsCount?.medium || 0) > 0 && (
                              <span className="text-yellow-400">{a.findingsCount.medium} Med</span>
                            )}
                            {!(a.findingsCount?.total) && !(a.findingsCount?.critical) && !(a.findingsCount?.high) && (
                              <span className="text-muted-foreground">0 Findings</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <VaptStatusBadge status={a.status} />
                        </TableCell>

                        <TableCell>
                          {a.environment === 'DEMO' ? (
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px] font-mono">DEMO</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-[10px] font-mono">PRODUCTION</Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Link href={`/vapt/${a.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 text-xs font-mono text-primary hover:text-primary gap-1">
                              <span>View Report</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground font-mono text-xs">
                        No VAPT assessments found. Click &quot;+ New Authorized Assessment&quot; to begin.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
