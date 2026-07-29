'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ShieldAlert, Activity, Cpu, ServerCrash, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';

export default function DashboardPage() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      try {
        const res = await api.get('/health');
        return res.data;
      } catch (err) {
        return { status: 'error' };
      }
    },
    refetchInterval: 15000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['alert-stats'],
    queryFn: async () => {
      // Mocking alert stats as backend might not have this exact endpoint yet
      return {
        activeAlerts: 14,
        criticalAlerts: 3,
        eventsPerSecond: 124,
        runningPlaybooks: 2,
        aiRequests: 89,
      };
    },
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Platform Dashboard</h1>
        {healthLoading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <div className="flex items-center space-x-2">
            {health?.status === 'ok' ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <ServerCrash className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm font-medium">{health?.status === 'ok' ? 'System Operational' : 'Degraded'}</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats?.activeAlerts}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats?.criticalAlerts}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events / sec</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats?.eventsPerSecond}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Requests (24h)</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats?.aiRequests}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Ingestion Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              [Chart placeholder - Add Recharts AreaChart here in beta]
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Running Playbooks</CardTitle>
          </CardHeader>
          <CardContent>
             {statsLoading ? (
              <Skeleton className="h-16 w-full" />
             ) : (
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Ransomware Containment</p>
                    <p className="text-sm text-muted-foreground">Execution ID: exec-8f92a</p>
                  </div>
                  <div className="ml-auto font-medium text-amber-500">Awaiting Approval</div>
                </div>
              </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
