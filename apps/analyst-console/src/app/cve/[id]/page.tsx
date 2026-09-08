'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Skeleton } from '../../../components/ui/skeleton';
import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Bot, ShieldAlert, ExternalLink, Shield } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function CveDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: cve, isLoading, isError } = useQuery({
    queryKey: ['cve', id],
    queryFn: async () => {
      const res = await api.get(`/v1/cve/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !cve) {
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load data for {id}
      </div>
    );
  }

  const metric = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
  const desc = cve.descriptions?.find((d: any) => d.lang === 'en')?.value || cve.descriptions?.[0]?.value || 'No description available.';
  const severity = metric?.baseSeverity || 'UNKNOWN';
  
  const getSeverityBadge = (s: string) => {
    switch (s.toUpperCase()) {
      case 'CRITICAL': return <Badge variant="destructive">Critical</Badge>;
      case 'HIGH': return <Badge variant="destructive" className="bg-orange-500">High</Badge>;
      case 'MEDIUM': return <Badge variant="secondary" className="bg-yellow-500 text-black">Medium</Badge>;
      case 'LOW': return <Badge variant="outline">Low</Badge>;
      default: return <Badge>{s}</Badge>;
    }
  };

  const getCvssScoreColor = (score: number) => {
    if (score >= 9) return 'bg-red-500';
    if (score >= 7) return 'bg-orange-500';
    if (score >= 4) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const scoreColor = getCvssScoreColor(metric?.baseScore || 0);

  // Extract products heuristically
  const extractProducts = () => {
    const products: string[] = [];
    if (cve.configurations) {
      cve.configurations.forEach((conf: any) => {
        conf.nodes?.forEach((node: any) => {
          node.cpeMatch?.forEach((cpe: any) => {
            if (cpe.criteria) products.push(cpe.criteria);
          });
        });
      });
    }
    return products;
  };

  const products = extractProducts();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href="/cve">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{cve.id}</h1>
        {getSeverityBadge(severity)}
        {cve.kevEntry && <Badge variant="destructive" className="bg-orange-500">CISA KEV</Badge>}
        <div className="flex-1" />
        <Link href={`/copilot?q=Analyze vulnerability ${cve.id} and provide a remediation plan`}>
          <Button className="bg-primary hover:bg-primary/90">
            <Bot className="mr-2 h-4 w-4" />
            AI Analysis
          </Button>
        </Link>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Published: {format(new Date(cve.published), 'MMMM dd, yyyy')} • Last Modified: {format(new Date(cve.lastModified), 'MMMM dd, yyyy')}
      </div>

      {cve.kevEntry && (
        <Card className="border-orange-500 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-orange-500">
              <ShieldAlert className="mr-2 h-5 w-5" />
              Known Exploited Vulnerability (CISA KEV)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="font-semibold text-foreground">Added:</span> {cve.kevEntry.dateAdded}</div>
            <div><span className="font-semibold text-foreground">Required Action:</span> {cve.kevEntry.requiredAction}</div>
            <div><span className="font-semibold text-foreground">Due Date:</span> <span className="text-red-400 font-medium">{cve.kevEntry.dueDate}</span></div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed">
          {desc}
        </CardContent>
      </Card>

      {metric && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>CVSS v3.1 Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 mb-4">
                <div className={`text-5xl font-black ${scoreColor.replace('bg-', 'text-')}`}>
                  {metric.baseScore.toFixed(1)}
                </div>
                <div className="text-muted-foreground mb-1">/ 10.0</div>
              </div>
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${scoreColor}`} 
                  style={{ width: `${(metric.baseScore / 10) * 100}%` }}
                />
              </div>
              <div className="mt-4 font-mono text-xs bg-muted p-2 rounded break-all">
                {metric.vectorString}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Impact Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-muted-foreground font-medium py-2">Attack Vector</TableCell>
                    <TableCell className="py-2 text-right">{metric.attackVector}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground font-medium py-2">Attack Complexity</TableCell>
                    <TableCell className="py-2 text-right">{metric.attackComplexity}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground font-medium py-2">Privileges Required</TableCell>
                    <TableCell className="py-2 text-right">{metric.privilegesRequired}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground font-medium py-2">User Interaction</TableCell>
                    <TableCell className="py-2 text-right">{metric.userInteraction}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground font-medium py-2">Scope</TableCell>
                    <TableCell className="py-2 text-right">{metric.scope}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground font-medium py-2">CIA Impact</TableCell>
                    <TableCell className="py-2 text-right">
                      {metric.confidentialityImpact.charAt(0)} / {metric.integrityImpact.charAt(0)} / {metric.availabilityImpact.charAt(0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {cve.weaknesses && cve.weaknesses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weaknesses (CWE)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {cve.weaknesses.map((w: any, idx: number) => {
                const cwe = w.description?.[0]?.value;
                if (!cwe) return null;
                return <Badge key={idx} variant="secondary">{cwe}</Badge>;
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Affected Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground max-h-60 overflow-y-auto">
              {products.map((p, i) => (
                <li key={i} className="truncate" title={p}>{p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {cve.references && cve.references.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>References</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {cve.references.map((ref: any, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <a href={ref.url} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                    {ref.url}
                  </a>
                  {ref.tags && ref.tags.map((tag: string, tIdx: number) => (
                    <Badge key={tIdx} variant="outline" className="text-[10px] py-0 px-1 ml-2">{tag}</Badge>
                  ))}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
