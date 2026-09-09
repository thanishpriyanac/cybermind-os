'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { format } from 'date-fns';
import { Skeleton } from '../../components/ui/skeleton';
import Link from 'next/link';
import { CheckCircle2, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';

interface Alert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'investigating' | 'resolved' | 'closed';
  createdAt: string;
  source: string;
  asset?: string;
}

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await api.get('/v1/events/alerts');
      return res.data.data as Alert[];
    },
    refetchInterval: 5000,
  });

  const ackAllMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/v1/events/alerts', { action: 'acknowledge_all' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setSuccessMsg('All new alerts have been acknowledged successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ alertId, status }: { alertId: string; status: Alert['status'] }) => {
      const res = await api.post('/v1/events/alerts', {
        action: 'update_status',
        alertId,
        status,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 font-semibold px-2.5 py-0.5">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-2.5 py-0.5">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 font-semibold px-2.5 py-0.5">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-muted-foreground border-border px-2.5 py-0.5">Low</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border border-blue-500/30">New</Badge>;
      case 'investigating':
        return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">Investigating</Badge>;
      case 'resolved':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline" className="text-muted-foreground border-border">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-primary" />
            Alert Queue & Threat Triage
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time security telemetry events, honeypot alerts, and EDR detections.
          </p>
        </div>
        <Button
          onClick={() => ackAllMutation.mutate()}
          disabled={ackAllMutation.isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-medium shadow-sm self-start sm:self-center"
        >
          {ackAllMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Acknowledge All
        </Button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm flex items-center gap-2 font-medium animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Main Alerts Table */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Active Alerts ({alerts?.length || 0})</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Acknowledge new threats or click Investigate to open full forensic breakdown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-[110px]">Severity</TableHead>
                  <TableHead>Title & Asset</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts && alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <TableRow key={alert.id} className="border-border hover:bg-muted/40">
                      <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{alert.title}</div>
                        {alert.asset && (
                          <div className="text-xs font-mono text-muted-foreground mt-0.5">{alert.asset}</div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(alert.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{alert.source}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {format(new Date(alert.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {alert.status === 'new' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ alertId: alert.id, status: 'investigating' })}
                              disabled={updateStatusMutation.isPending}
                              className="h-8 text-xs border-primary/40 text-primary hover:bg-primary/10 gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Ack
                            </Button>
                          ) : alert.status === 'investigating' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ alertId: alert.id, status: 'resolved' })}
                              disabled={updateStatusMutation.isPending}
                              className="h-8 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 gap-1"
                            >
                              Resolve
                            </Button>
                          ) : null}

                          <Link href={`/investigations?alertId=${alert.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 hover:bg-muted">
                              Investigate
                              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No security alerts found in queue.
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
