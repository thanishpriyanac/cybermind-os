'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface OwaspCategoryItem {
  code: string;
  name: string;
  description?: string;
}

export const OWASP_TOP_10_CATEGORIES: OwaspCategoryItem[] = [
  { code: 'A01:2021', name: 'Broken Access Control', description: 'Access control enforces policy such that users cannot act outside of their intended permissions.' },
  { code: 'A02:2021', name: 'Cryptographic Failures', description: 'Failures relating to cryptography (or lack thereof) leading to sensitive data exposure.' },
  { code: 'A03:2021', name: 'Injection', description: 'SQL, NoSQL, OS Command, ORM, and LDAP injection when untrusted data is sent to an interpreter.' },
  { code: 'A04:2021', name: 'Insecure Design', description: 'Focuses on risks related to design and architectural flaws.' },
  { code: 'A05:2021', name: 'Security Misconfiguration', description: 'Unsecure default configs, incomplete setups, open cloud storage, and unpatched flaws.' },
  { code: 'A06:2021', name: 'Vulnerable & Outdated Components', description: 'Using components with known vulnerabilities that compromise application defense.' },
  { code: 'A07:2021', name: 'Identification & Authentication Failures', description: 'Confirmation of the user identity, authentication, and session management.' },
  { code: 'A08:2021', name: 'Software & Data Integrity Failures', description: 'Relates to code and infrastructure that does not protect against integrity violations.' },
  { code: 'A09:2021', name: 'Security Logging & Monitoring Failures', description: 'Insufficient logging and monitoring allowing attackers to maintain persistence.' },
  { code: 'A10:2021', name: 'Server-Side Request Forgery (SSRF)', description: 'Occurs when a web app fetches a remote resource without validating the user-supplied URL.' },
];

export interface VaptOwaspMatrixProps {
  vulnerabilities: { owaspCategory: string }[];
}

export function VaptOwaspMatrix({ vulnerabilities }: VaptOwaspMatrixProps) {
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const getViolationCount = (code: string) => {
    return vulnerabilities.filter((v) => v.owaspCategory === code || v.owaspCategory?.startsWith(code.split(':')[0])).length;
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold font-mono text-foreground">OWASP Top 10 (2021) Compliance Matrix</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Actionable breakdown of security violations mapped against OWASP standard categories.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Mobile Expandable Cards (< 768px md breakpoint) */}
        <div className="block md:hidden divide-y divide-border">
          {OWASP_TOP_10_CATEGORIES.map((cat) => {
            const count = getViolationCount(cat.code);
            const isExpanded = expandedCode === cat.code;

            return (
              <div key={cat.code} className="p-3.5 space-y-2">
                <div 
                  onClick={() => setExpandedCode(isExpanded ? null : cat.code)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-cyan-400">{cat.code}</span>
                      {count > 0 ? (
                        <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/40 text-[9px] font-mono">
                          {count} Violation{count > 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-[9px] font-mono">
                          Passed
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-foreground block">{cat.name}</span>
                  </div>

                  <button className="p-1 text-muted-foreground hover:text-foreground">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {isExpanded && cat.description && (
                  <p className="text-xs text-muted-foreground pt-1 leading-relaxed bg-muted/30 p-2.5 rounded border border-border/60">
                    {cat.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop / Laptop Data-Rich Table (>= 768px md breakpoint) */}
        <div className="hidden md:block">
          <Table>
            <TableHeader className="bg-card/95 border-b border-border font-mono text-xs">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-28 uppercase">Category</TableHead>
                <TableHead className="uppercase">Category Name & Scope</TableHead>
                <TableHead className="text-center w-36 uppercase">Findings Count</TableHead>
                <TableHead className="text-right w-36 uppercase">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {OWASP_TOP_10_CATEGORIES.map((cat) => {
                const count = getViolationCount(cat.code);
                return (
                  <TableRow key={cat.code} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono font-bold text-xs text-cyan-400">{cat.code}</TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-foreground block">{cat.name}</span>
                      <span className="text-[11px] text-muted-foreground block line-clamp-1">{cat.description}</span>
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm font-extrabold">{count}</TableCell>
                    <TableCell className="text-right">
                      {count > 0 ? (
                        <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/40 text-[10px] font-mono">
                          {count} Violation{count > 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                          Passed
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
