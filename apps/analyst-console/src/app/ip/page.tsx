'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { Shield, Search, Globe, Network, Server, Clock, AlertTriangle, AlertCircle, Database, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

export default function IpIntelligencePage() {
  const queryClient = useQueryClient();
  const [ipInput, setIpInput] = useState('');
  const [currentIp, setCurrentIp] = useState('');
  
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['ip-status'],
    queryFn: async () => {
      const res = await api.get('/v1/ip/status');
      return res.data;
    }
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['ip-history'],
    queryFn: async () => {
      const res = await api.get('/v1/ip/history');
      return res.data;
    }
  });

  const lookupMutation = useMutation({
    mutationFn: async (ip: string) => {
      const res = await api.post('/v1/ip/lookup', { ip });
      return res.data;
    },
    onSuccess: (data) => {
      setCurrentIp(data.ip);
      queryClient.invalidateQueries({ queryKey: ['ip-history'] });
    }
  });

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput) return;
    lookupMutation.mutate(ipInput);
  };

  const getThreatBadge = (classification: string) => {
    switch (classification) {
      case 'malicious': return <Badge variant="destructive" className="text-lg py-1 px-3">Malicious</Badge>;
      case 'suspicious': return <Badge variant="destructive" className="bg-orange-500 text-lg py-1 px-3">Suspicious</Badge>;
      case 'low_risk': return <Badge variant="secondary" className="bg-yellow-500 text-black text-lg py-1 px-3">Low Risk</Badge>;
      case 'clean': return <Badge className="bg-green-500 text-lg py-1 px-3">Clean</Badge>;
      default: return <Badge className="text-lg py-1 px-3">{classification}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 40) return 'text-orange-500';
    if (score >= 10) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 40) return 'bg-orange-500';
    if (score >= 10) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-8 w-8 text-primary" />
          IP Intelligence
        </h1>
        {statusLoading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <Badge variant={status?.configured ? 'outline' : 'destructive'} className="text-sm">
            {status?.configured ? 'API Configured' : 'Missing API Key'}
          </Badge>
        )}
      </div>

      {!statusLoading && !status?.configured && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Configuration Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">AbuseIPDB API key not configured. Add ABUSEIPDB_API_KEY to your .env.local file to enable IP reputation lookups. Get a free API key at abuseipdb.com.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>IP Lookup</CardTitle>
          <CardDescription>Investigate an IP address for threat intelligence and reputation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLookup} className="flex gap-4">
            <Input 
              placeholder="Enter IP address (IPv4 or IPv6)" 
              value={ipInput} 
              onChange={(e) => setIpInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={lookupMutation.isPending || !ipInput || (!status?.configured && !statusLoading)}>
              {lookupMutation.isPending ? 'Investigating...' : <><Search className="mr-2 h-4 w-4" /> Investigate IP</>}
            </Button>
          </form>
          {lookupMutation.isError && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {(lookupMutation.error as any)?.response?.data?.error || lookupMutation.error.message}
            </p>
          )}
        </CardContent>
      </Card>

      {lookupMutation.data && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle>Verdict</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
                {getThreatBadge(lookupMutation.data.threatClassification)}
                
                <div className="text-center w-full mt-4">
                  <div className="text-5xl font-bold mb-2">
                    <span className={getScoreColor(lookupMutation.data.abuseScore)}>{lookupMutation.data.abuseScore}</span>
                    <span className="text-2xl text-muted-foreground">/100</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">Abuse Confidence Score</div>
                  
                  <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getScoreBgColor(lookupMutation.data.abuseScore)}`} 
                      style={{ width: \`\${Math.max(lookupMutation.data.abuseScore, 2)}%\` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>IP Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Network className="h-3 w-3"/> IP Address</div>
                    <div className="font-medium font-mono">{lookupMutation.data.ip}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Database className="h-3 w-3"/> Version</div>
                    <div className="font-medium">IPv{lookupMutation.data.ipVersion}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3"/> Country</div>
                    <div className="font-medium">{lookupMutation.data.countryName || 'Unknown'} {lookupMutation.data.countryCode && \`(\${lookupMutation.data.countryCode})\`}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Server className="h-3 w-3"/> ISP</div>
                    <div className="font-medium truncate" title={lookupMutation.data.isp}>{lookupMutation.data.isp || 'N/A'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Network className="h-3 w-3"/> Domain</div>
                    <div className="font-medium truncate">{lookupMutation.data.domain || 'N/A'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Server className="h-3 w-3"/> Usage Type</div>
                    <div className="font-medium">{lookupMutation.data.usageType || 'N/A'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3"/> Whitelisted</div>
                    <div className="font-medium">{lookupMutation.data.isWhitelisted ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/> Last Reported</div>
                    <div className="font-medium">{lookupMutation.data.lastReported ? format(new Date(lookupMutation.data.lastReported), 'MMM dd, yyyy') : 'Never'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Reports ({lookupMutation.data.totalReports})</CardTitle>
            </CardHeader>
            <CardContent>
              {lookupMutation.data.reports && lookupMutation.data.reports.length > 0 ? (
                <div className="space-y-4">
                  {lookupMutation.data.reports.map((report: any, idx: number) => (
                    <div key={idx} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm text-muted-foreground">{format(new Date(report.reportedAt), 'MMM dd, yyyy HH:mm:ss')}</div>
                        <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                          {report.categoryNames.map((cat: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{cat}</Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm italic">"{report.comment}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No recent reports found for this IP.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Investigation History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>ISP</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Threat Level</TableHead>
                  <TableHead>Investigated At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history && history.length > 0 ? (
                  history.map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono">{inv.ip}</TableCell>
                      <TableCell>{inv.countryName || 'Unknown'}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={inv.isp}>{inv.isp}</TableCell>
                      <TableCell>
                        <span className={getScoreColor(inv.abuseScore)}>{inv.abuseScore}</span>
                      </TableCell>
                      <TableCell>
                        {inv.threatClassification === 'malicious' ? <Badge variant="destructive">Malicious</Badge> :
                         inv.threatClassification === 'suspicious' ? <Badge variant="destructive" className="bg-orange-500">Suspicious</Badge> :
                         inv.threatClassification === 'low_risk' ? <Badge variant="secondary" className="bg-yellow-500 text-black">Low Risk</Badge> :
                         <Badge className="bg-green-500">Clean</Badge>}
                      </TableCell>
                      <TableCell>{format(new Date(inv.investigatedAt), 'MMM dd, HH:mm')}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => { setIpInput(inv.ip); handleLookup({ preventDefault: () => {} } as any); }}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No IP investigations yet. Enter an IP address above to start.
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
