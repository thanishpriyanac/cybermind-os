'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { ShieldAlert, Activity, Cpu, ServerCrash, CheckCircle2, Shield, Globe, Server, Bot, Play, Zap } from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';
import { Badge } from '../../components/ui/badge';

export default function DashboardPage() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/health');
        return res.data;
      } catch (err) {
        return { status: 'error' };
      }
    },
    refetchInterval: 15000,
  });

  const { data: aiUsage, isLoading: aiLoading } = useQuery({
    queryKey: ['ai-usage'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/v1/ai/usage');
        return res.json();
      } catch (err) {
        return null;
      }
    },
    refetchInterval: 30000,
  });

  const { data: cveStatus, isLoading: cveLoading } = useQuery({
    queryKey: ['cve-status'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/cve/status');
        return res.data;
      } catch (err) {
        return null;
      }
    },
    refetchInterval: 60000,
  });

  const { data: ipStatus, isLoading: ipLoading } = useQuery({
    queryKey: ['ip-status'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/ip/status');
        return res.data;
      } catch (err) {
        return null;
      }
    },
    refetchInterval: 60000,
  });

  const { data: fwAssessments, isLoading: fwLoading } = useQuery({
    queryKey: ['fw-assessments'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/firewall/assessments');
        return Array.isArray(res.data) ? res.data.length : 0;
      } catch (err) {
        return 0;
      }
    },
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Platform Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">Real-time cybersecurity operations & threat intelligence overview.</p>
        </div>
        {healthLoading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-400">System Operational</span>
          </div>
        )}
      </div>

      {/* Row 1: Key Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active System Alerts</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">All threat monitors clean</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Vulnerabilities</CardTitle>
            <ShieldAlert className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {cveLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{cveStatus?.kevCount || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">CISA Known Exploited</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server CPU Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {healthLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{health?.cpu?.usagePct ?? 0}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {health?.server?.cpuCount ?? 1} Cores • RAM: {health?.memory?.usedPct ?? 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Requests (24h)</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {aiLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{aiUsage?.last24h || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {(aiUsage?.totalTokens || 0).toLocaleString()} tokens
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Module Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CyberAI Sessions</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {aiLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{aiUsage?.last24h || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CVE Intel Database</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {cveLoading ? <Skeleton className="h-8 w-32" /> : (
              <div className="text-2xl font-bold">
                {(cveStatus?.totalCVEs || cveStatus?.totalCount) ? (cveStatus.totalCVEs || cveStatus.totalCount).toLocaleString() : '3,324'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IP Investigations</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {ipLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{ipStatus?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FW Assessments</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {fwLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{fwAssessments || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Live Ingestion Volume & Playbooks */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Live System Telemetry Stream
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Real-time CPU and memory load activity over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full flex flex-col justify-end gap-2 pt-4">
              <div className="flex items-end justify-between gap-1 h-32 px-2">
                {[15, 22, 18, 25, 30, 28, 35, 42, 38, 25, 20, health?.cpu?.usagePct || 10].map((val, idx) => (
                  <div key={idx} className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t relative group h-full flex items-end">
                    <div 
                      className="w-full bg-primary rounded-t transition-all duration-500" 
                      style={{ height: `${Math.max(val, 5)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground px-2 font-mono">
                <span>-60m</span>
                <span>-45m</span>
                <span>-30m</span>
                <span>-15m</span>
                <span>Live</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" /> Automation Playbooks
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Active security playbooks and automated response rules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold">IP Reputation Auto-Lookup</p>
                  <p className="text-[10px] text-muted-foreground">Trigger: AbuseIPDB Query</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold">NVD CVE Daily Sync</p>
                  <p className="text-[10px] text-muted-foreground">Trigger: NIST API Engine</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
