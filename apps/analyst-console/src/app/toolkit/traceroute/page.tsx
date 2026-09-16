'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Activity, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  Globe, 
  Bot, 
  ArrowRight,
  Server,
  Radio
} from 'lucide-react';
import { CyberPageHeader, CyberCard, CyberMetric } from '../../../components/cybermind/CyberPrimitives';
import { CyberStatusBadge } from '../../../components/cybermind/CyberBadges';
import { CyberCorrelationPanel } from '../../../components/cybermind/CyberCorrelationPanel';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { SecurityObject } from '../../../lib/toolkit/types';
import { saveToolkitHistoryItem } from '../../../lib/toolkit/store';

export default function TracerouteVisualizerPage() {
  const router = useRouter();
  const [targetIp, setTargetIp] = useState('185.220.101.5');
  const [isTracing, setIsTracing] = useState(false);
  const [traceResult, setTraceResult] = useState<any | null>({
    target: '185.220.101.5',
    totalHops: 6,
    avgLatency: '42ms',
    packetLoss: '0%',
    hops: [
      { hop: 1, ip: '10.10.10.1', hostname: 'gw-internal.corp.local', latency: '1.2ms', loss: '0%', asn: 'Internal Subnet', status: 'HEALTHY' },
      { hop: 2, ip: '192.168.100.1', hostname: 'edge-router.isp.net', latency: '4.5ms', loss: '0%', asn: 'AS7018 AT&T', status: 'HEALTHY' },
      { hop: 3, ip: '68.1.20.10', hostname: 'core-backbone-01.transit.net', latency: '14.2ms', loss: '0%', asn: 'AS1299 Telia', status: 'HEALTHY' },
      { hop: 4, ip: '*', hostname: 'Request Timed Out (Firewall Filtered)', latency: '*', loss: '25%', asn: 'Unknown Transit', status: 'UNRESPONSIVE_HOP' },
      { hop: 5, ip: '194.26.29.1', hostname: 'de-cix-frankfurt.exchange.de', latency: '180.4ms', loss: '0%', asn: 'AS6939 Hurricane Electric', status: 'LATENCY_SPIKE' },
      { hop: 6, ip: '185.220.101.5', hostname: 'tor-exit-node.dark.net', latency: '184.1ms', loss: '0%', asn: 'AS208294 Cyberbunker', status: 'HEALTHY' },
    ],
  });

  const handleRunTrace = () => {
    setIsTracing(true);
    setTimeout(() => {
      setIsTracing(false);
      saveToolkitHistoryItem({
        toolId: 'traceroute',
        toolName: 'Traceroute Visualizer',
        target: targetIp,
        risk: 'INFO',
        summaryText: `Traced route to ${targetIp} across 6 Hops — Latency Spike detected at Hop #5 (180ms)`,
        data: traceResult,
      });
    }, 1000);
  };

  const selectedSecurityObject: SecurityObject | null = traceResult ? {
    id: `obj-tr-${traceResult.target}`,
    type: 'IP',
    value: traceResult.target,
    source: 'Traceroute Visualizer',
    timestamp: new Date().toISOString(),
    risk: 'INFO',
    confidence: 100,
    tags: ['traceroute', 'latency-spike', 'intermediate-hop'],
    metadata: traceResult,
  } : null;

  return (
    <div className="space-y-6">
      <CyberPageHeader
        title="Traceroute Path & Network Hop Visualizer"
        description="Hop-by-hop packet route tracing, latency spike identification, and intermediate firewall timeout detection."
        breadcrumbs={[
          { label: 'Security Toolkit', href: '/toolkit/ioc-analyzer' },
          { label: 'Traceroute Visualizer' },
        ]}
        badge={<CyberStatusBadge status="ACTIVE" />}
      />

      {/* Input */}
      <CyberCard className="p-5">
        <form onSubmit={(e) => { e.preventDefault(); handleRunTrace(); }} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                value={targetIp}
                onChange={(e) => setTargetIp(e.target.value)}
                placeholder="Enter IP or Hostname to trace route..."
                className="bg-slate-900 border-slate-800 font-mono text-xs text-slate-100 pr-10 h-10"
              />
              <Radio className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            </div>

            <Button
              type="submit"
              disabled={isTracing || !targetIp}
              className="h-10 px-6 font-mono text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
            >
              {isTracing ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Tracing Hops...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Traceroute
                </>
              )}
            </Button>
          </div>
        </form>
      </CyberCard>

      {/* Results */}
      {traceResult && !isTracing && (
        <div className="space-y-6">
          {/* Node Progression Graph */}
          <CyberCard className="p-5 space-y-4 overflow-hidden">
            <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3">
              Visual Hop Route Graph (Client &rarr; Gateway &rarr; ISP &rarr; Transit &rarr; Destination)
            </h3>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs py-2 overflow-x-auto">
              {traceResult.hops.map((h: any, idx: number) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />}
                  <div className={`p-3 rounded border shrink-0 text-center space-y-1 ${
                    h.status === 'LATENCY_SPIKE'
                      ? 'bg-yellow-950/20 border-yellow-500/40 text-yellow-300'
                      : h.status === 'UNRESPONSIVE_HOP'
                      ? 'bg-slate-900 border-dashed border-slate-700 text-slate-500'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}>
                    <div className="text-[10px] font-bold text-cyan-400">Hop #{h.hop}</div>
                    <div className="font-bold text-xs">{h.ip}</div>
                    <div className="text-[10px] text-slate-400">{h.latency}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </CyberCard>

          {/* Hop Table */}
          <CyberCard className="p-5 space-y-4 overflow-hidden">
            <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3">
              Detailed Hop Latency & Loss Table
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3">Hop #</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3">Hostname</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3">Packet Loss</th>
                    <th className="py-2.5 px-3">ASN / ISP</th>
                    <th className="py-2.5 px-3 text-right">Pivot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {traceResult.hops.map((h: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-cyan-400">#{h.hop}</td>
                      <td className="py-3 px-3 font-bold text-slate-200">{h.ip}</td>
                      <td className="py-3 px-3 text-slate-300">{h.hostname}</td>
                      <td className={`py-3 px-3 font-bold ${h.status === 'LATENCY_SPIKE' ? 'text-yellow-400' : 'text-slate-300'}`}>
                        {h.latency}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{h.loss}</td>
                      <td className="py-3 px-3 text-slate-400">{h.asn}</td>
                      <td className="py-3 px-3 text-right">
                        {h.ip !== '*' && (
                          <Button
                            onClick={() => router.push(`/toolkit/ioc-analyzer?target=${h.ip}`)}
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] font-mono border-slate-700 hover:bg-slate-800"
                          >
                            Inspect IP &rarr;
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CyberCard>

          {/* Correlation Engine */}
          {selectedSecurityObject && (
            <CyberCorrelationPanel
              object={selectedSecurityObject}
              onAskCyberAI={(prompt) => router.push(`/copilot?prompt=${encodeURIComponent(prompt)}`)}
            />
          )}
        </div>
      )}
    </div>
  );
}
