'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { VaptRiskBadge } from './VaptBadges';
import { VaptFindingCard, FindingItem } from './VaptFindingCard';
import { ExternalLink, Copy, ChevronRight } from 'lucide-react';

export interface VaptFindingTableProps {
  findings: FindingItem[];
  isLoading?: boolean;
  onCopyRemediation?: (text: string) => void;
}

export function VaptFindingTable({ findings, isLoading = false, onCopyRemediation }: VaptFindingTableProps) {
  return (
    <>
      {/* Mobile Finding Cards (< 768px md breakpoint) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-8 w-full" />
            </Card>
          ))
        ) : findings.length > 0 ? (
          findings.map((f) => (
            <VaptFindingCard key={f.id} finding={f} onCopyRemediation={onCopyRemediation} />
          ))
        ) : (
          <Card className="p-8 text-center text-muted-foreground text-xs font-mono">
            No vulnerabilities or findings recorded in scope.
          </Card>
        )}
      </div>

      {/* Desktop / Laptop Finding Table (>= 768px md breakpoint) */}
      <div className="hidden md:block">
        <Card className="border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-md z-10 border-b border-border">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-mono text-xs uppercase">Severity & Finding Title</TableHead>
                    <TableHead className="font-mono text-xs uppercase">OWASP Category</TableHead>
                    <TableHead className="font-mono text-xs uppercase">CWE</TableHead>
                    <TableHead className="font-mono text-xs uppercase">CVSS</TableHead>
                    <TableHead className="font-mono text-xs uppercase">Endpoint Target</TableHead>
                    <TableHead className="font-mono text-xs uppercase">Confidence</TableHead>
                    <TableHead className="font-mono text-xs uppercase">CVE Correlations</TableHead>
                    <TableHead className="font-mono text-xs uppercase text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : findings.length > 0 ? (
                    findings.map((f) => (
                      <TableRow key={f.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Badge variant={f.severity === 'CRITICAL' ? 'destructive' : 'outline'} className="font-mono text-[10px] shrink-0">
                              {f.severity}
                            </Badge>
                            <span className="font-bold text-sm text-foreground">{f.title}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs font-mono text-cyan-400 font-semibold">
                          {f.owaspCategory}
                        </TableCell>

                        <TableCell className="text-xs font-mono text-purple-300 font-semibold">
                          {f.cwe}
                        </TableCell>

                        <TableCell className="text-xs font-mono font-extrabold text-foreground">
                          {f.cvss}
                        </TableCell>

                        <TableCell className="text-xs font-mono text-cyan-300 max-w-[200px] truncate">
                          <code>{f.endpoint}</code>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono text-[10px]">
                            {f.verificationStatus}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs font-mono">
                          {f.cveIds && f.cveIds.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {f.cveIds.map((cve) => (
                                <Link key={cve} href={`/cve/${cve}`} className="text-primary hover:underline font-bold text-[11px]">
                                  {cve}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">N/A</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {f.remediation && onCopyRemediation && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onCopyRemediation(f.remediation!)}
                              className="h-8 text-xs font-mono text-emerald-400 hover:text-emerald-300 gap-1"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Fix</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground font-mono text-xs">
                        No security vulnerabilities found.
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
