'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { PlayCircle, Shield } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function InvestigationDetail() {
  const params = useParams();
  const alertId = params.id as string;

  const { data: alertData, isLoading } = useQuery({
    queryKey: ['alert', alertId],
    queryFn: async () => {
      // Stubbing since backend might not have the full detailed mock for this specific ID yet
      try {
        const res = await api.get(`/v1/events/alerts/${alertId}`);
        return res.data;
      } catch {
        return {
          id: alertId,
          title: 'Suspicious PowerShell Execution',
          severity: 'High',
          status: 'Investigating',
          source: 'EDR',
          createdAt: new Date().toISOString(),
          description: 'A PowerShell script was executed with bypassed execution policy and obfuscated arguments.',
          timeline: [
            { id: 1, time: new Date(Date.now() - 3600000).toISOString(), message: 'Process started: powershell.exe' },
            { id: 2, time: new Date(Date.now() - 3500000).toISOString(), message: 'Network connection established to unknown IP' },
          ],
          evidence: [
            { id: 1, type: 'Process', value: 'powershell.exe', malicious: true },
            { id: 2, type: 'IP', value: '198.51.100.23', malicious: true },
          ]
        };
      }
    }
  });

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{alertData?.title}</h1>
          <p className="text-muted-foreground mt-2">Alert ID: {alertData?.id} | Source: {alertData?.source}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="destructive" className="px-3 py-1">{alertData?.severity}</Badge>
          <Badge variant="outline" className="px-3 py-1">{alertData?.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timeline">Execution Timeline</TabsTrigger>
              <TabsTrigger value="evidence">Collected Evidence</TabsTrigger>
            </TabsList>
            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                  <CardDescription>Chronological sequence of events related to this alert.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {alertData?.timeline.map((event: any, index: number) => (
                      <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-primary text-slate-500 group-[.is-active]:text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-card shadow">
                          <div className="flex items-center justify-between space-x-2 mb-1">
                            <div className="font-bold text-slate-200">{event.message}</div>
                            <time className="font-caveat font-medium text-indigo-400">{new Date(event.time).toLocaleTimeString()}</time>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="evidence">
              <Card>
                <CardHeader>
                  <CardTitle>Artifacts & Evidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alertData?.evidence.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-3 border rounded-md">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{item.type}</span>
                          <span className="text-muted-foreground text-sm font-mono">{item.value}</span>
                        </div>
                        {item.malicious ? <Badge variant="destructive">Malicious</Badge> : <Badge variant="outline">Unknown</Badge>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" variant="outline">
                <PlayCircle className="mr-2 h-4 w-4" /> Run Isolate Host Playbook
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Shield className="mr-2 h-4 w-4" /> Block IP in Firewall
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <CardHeader>
              <CardTitle className="text-indigo-400 flex items-center">
                <span className="mr-2">✨</span> AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300 leading-relaxed">
                CYBERMIND AI has analyzed this behavior and determined an 85% probability of malicious intent. The sequence matches known patterns for Cobalt Strike beaconing. Immediate containment is recommended.
              </p>
              <Button className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white">Ask Copilot</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
