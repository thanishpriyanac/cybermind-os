'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  RefreshCw, 
  Download, 
  Copy, 
  CheckCircle2, 
  Activity, 
  Bot,
  ArrowRight
} from 'lucide-react';
import { CyberPageHeader, CyberCard, CyberMetric } from '../../../components/cybermind/CyberPrimitives';
import { CyberStatusBadge } from '../../../components/cybermind/CyberBadges';
import { Button } from '../../../components/ui/button';
import { saveToolkitHistoryItem } from '../../../lib/toolkit/store';

export default function LogConverterPage() {
  const router = useRouter();
  const [rawInput, setRawInput] = useState(`2026-09-16T19:10:02Z srcip=192.168.1.105 dstip=185.220.101.5 srcport=54210 dstport=443 action=deny user=admin msg="Implicit deny"
2026-09-16T19:10:05Z srcip=185.220.101.5 dstip=10.10.10.20 dstport=3389 action=failure user=administrator msg="RDP logon failed"`);

  const [outputFormat, setOutputFormat] = useState<'JSON' | 'CSV' | 'CEF'>('JSON');
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [normalizedResult, setNormalizedResult] = useState<string | null>(null);

  const handleNormalize = () => {
    setIsNormalizing(true);
    setTimeout(() => {
      const normalizedArray = [
        {
          timestamp: '2026-09-16T19:10:02Z',
          source: { ip: '192.168.1.105', port: 54210 },
          destination: { ip: '185.220.101.5', port: 443 },
          user: 'admin',
          hostname: 'FG100E-Primary',
          action: 'DENY',
          event: { type: 'network', category: 'firewall' },
          severity: 'HIGH',
          message: 'Implicit deny policy action executed',
        },
        {
          timestamp: '2026-09-16T19:10:05Z',
          source: { ip: '185.220.101.5', port: 49152 },
          destination: { ip: '10.10.10.20', port: 3389 },
          user: 'administrator',
          hostname: 'AUTH-SRV-01',
          action: 'FAILURE',
          event: { type: 'authentication', category: 'rdp' },
          severity: 'HIGH',
          message: 'RDP logon failed for privileged account',
        },
      ];

      let formattedOutput = '';
      if (outputFormat === 'JSON') {
        formattedOutput = JSON.stringify(normalizedArray, null, 2);
      } else if (outputFormat === 'CSV') {
        formattedOutput = `timestamp,source.ip,destination.ip,user,action,event.type,severity\n2026-09-16T19:10:02Z,192.168.1.105,185.220.101.5,admin,DENY,network,HIGH\n2026-09-16T19:10:05Z,185.220.101.5,10.10.10.20,administrator,FAILURE,authentication,HIGH`;
      } else {
        formattedOutput = `CEF:0|CyberMind|SOC|1.0|100|Firewall Deny|7|src=192.168.1.105 dst=185.220.101.5 spt=54210 dpt=443 suser=admin act=DENY\nCEF:0|CyberMind|SOC|1.0|200|RDP Failure|8|src=185.220.101.5 dst=10.10.10.20 spt=49152 dpt=3389 suser=administrator act=FAILURE`;
      }

      setNormalizedResult(formattedOutput);
      setIsNormalizing(false);

      saveToolkitHistoryItem({
        toolId: 'log-converter',
        toolName: 'Log Converter / Normalizer',
        target: 'Raw Log Input',
        risk: 'INFO',
        summaryText: `Normalized 2 raw log events into standard ${outputFormat} schema`,
        data: formattedOutput,
      });
    }, 700);
  };

  return (
    <div className="space-y-6">
      <CyberPageHeader
        title="Log Converter & Common Schema Normalizer"
        description="Transform unformatted Syslog, CSV, and raw log text into standardized CyberMind JSON, CEF, or CSV schemas."
        breadcrumbs={[
          { label: 'Security Toolkit', href: '/toolkit/ioc-analyzer' },
          { label: 'Log Converter' },
        ]}
        badge={<CyberStatusBadge status="HEALTHY" />}
      />

      {/* Input & Output Config */}
      <CyberCard className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-mono font-medium text-slate-300">
              Raw Log Input Stream
            </label>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={6}
              className="w-full p-3 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-mono font-medium text-slate-300">Target Output Schema Format</label>
            <div className="space-y-2 font-mono text-xs">
              {(['JSON', 'CSV', 'CEF'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setOutputFormat(fmt)}
                  className={`w-full p-2.5 rounded border text-left flex items-center justify-between ${
                    outputFormat === fmt ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span>{fmt} Schema</span>
                  {outputFormat === fmt && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </button>
              ))}
            </div>

            <Button
              onClick={handleNormalize}
              disabled={isNormalizing || !rawInput}
              className="w-full h-10 font-mono text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold mt-4"
            >
              {isNormalizing ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Normalizing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Convert & Normalize
                </>
              )}
            </Button>
          </div>
        </div>
      </CyberCard>

      {/* Output Result Preview */}
      {normalizedResult && !isNormalizing && (
        <CyberCard className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Normalized {outputFormat} Output Preview</span>
            </h3>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigator.clipboard.writeText(normalizedResult)}
                variant="outline"
                size="sm"
                className="h-7 text-xs font-mono border-slate-700"
              >
                <Copy className="w-3.5 h-3.5 mr-1" />
                Copy
              </Button>
              <Button
                onClick={() => router.push(`/toolkit/log-analyzer`)}
                variant="outline"
                size="sm"
                className="h-7 text-xs font-mono border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20"
              >
                Send to Log Analyzer &rarr;
              </Button>
            </div>
          </div>

          <pre className="p-4 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto max-h-96">
            {normalizedResult}
          </pre>
        </CyberCard>
      )}
    </div>
  );
}
