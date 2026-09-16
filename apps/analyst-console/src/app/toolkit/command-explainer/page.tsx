'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Bot, 
  Search, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  FileText, 
  Copy,
  BookOpen
} from 'lucide-react';
import { CyberPageHeader, CyberCard, CyberMetric } from '../../../components/cybermind/CyberPrimitives';
import { CyberSeverityBadge, CyberStatusBadge } from '../../../components/cybermind/CyberBadges';
import { CyberCorrelationPanel } from '../../../components/cybermind/CyberCorrelationPanel';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { SecurityObject } from '../../../lib/toolkit/types';
import { saveToolkitHistoryItem } from '../../../lib/toolkit/store';

export default function CommandExplainerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCmd = searchParams.get('cmd') || 'diagnose debug application ike -1';

  const [cmdInput, setCmdInput] = useState(initialCmd);
  const [explanationMode, setExplanationMode] = useState<'technical' | 'beginner' | 'troubleshooting'>('technical');
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationResult, setExplanationResult] = useState<any | null>(null);

  useEffect(() => {
    if (initialCmd) {
      handleExplainCommand(initialCmd);
    }
  }, []);

  const handleExplainCommand = (cmd: string) => {
    if (!cmd) return;
    setIsExplaining(true);

    setTimeout(() => {
      let platform = 'FortiGate CLI';
      if (cmd.includes('Get-') || cmd.includes('Select-Object')) platform = 'PowerShell';
      else if (cmd.includes('sudo') || cmd.includes('ss ') || cmd.includes('grep')) platform = 'Linux Shell';
      else if (cmd.includes('show ip')) platform = 'Cisco IOS';

      const res = {
        command: cmd,
        platform,
        purpose: 'Displays real-time Internet Key Exchange (IKE/IPsec) VPN negotiation debug messages.',
        useCase: 'Troubleshooting IPsec VPN phase 1 / phase 2 tunnel establishment failures.',
        syntax: 'diagnose debug application ike <debug-level>',
        parameters: [
          { param: 'diagnose debug application ike', description: 'Enables IKE daemon tracing mode' },
          { param: '-1', description: 'Sets debug verbosity level to maximum (all events, warnings, errors, keys)' },
        ],
        expectedOutput: 'IKEv2 exchange logs showing SA proposals, DH group matching, and SPI authentication tokens.',
        potentialRisks: 'High CPU utilization if run during peak traffic on busy firewalls. Always remember to run "diagnose debug disable" afterwards.',
        relatedCommands: [
          'diagnose debug enable',
          'diagnose debug disable',
          'diagnose vpn ipsec tunnel summary',
        ],
      };

      setExplanationResult(res);
      setIsExplaining(false);

      saveToolkitHistoryItem({
        toolId: 'command-explainer',
        toolName: 'Explain This Command',
        target: cmd,
        risk: 'INFO',
        summaryText: `Explained ${platform} command: "${cmd}"`,
        data: res,
      });
    }, 850);
  };

  const selectedSecurityObject: SecurityObject | null = explanationResult ? {
    id: `obj-cmd-${Date.now()}`,
    type: 'LOG_EVENT',
    value: explanationResult.command,
    source: 'Explain This Command',
    timestamp: new Date().toISOString(),
    risk: 'INFO',
    confidence: 100,
    tags: ['command-explainer', explanationResult.platform.toLowerCase().replace(/\s+/g, '-')],
    metadata: explanationResult,
  } : null;

  return (
    <div className="space-y-6">
      <CyberPageHeader
        title="Command Syntax & Safety Explainer"
        description="Deep breakdown of CLI commands (FortiGate, PowerShell, Linux, Cisco) for safety, parameters, risks, and expected output."
        breadcrumbs={[
          { label: 'Security Toolkit', href: '/toolkit/ioc-analyzer' },
          { label: 'Explain This Command' },
        ]}
        badge={<CyberStatusBadge status="ACTIVE" />}
      />

      {/* Input */}
      <CyberCard className="p-5">
        <form onSubmit={(e) => { e.preventDefault(); handleExplainCommand(cmdInput); }} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-slate-300">
              CLI Command String
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  value={cmdInput}
                  onChange={(e) => setCmdInput(e.target.value)}
                  placeholder="Paste command (e.g. diagnose debug application ike -1)..."
                  className="bg-slate-900 border-slate-800 font-mono text-xs text-slate-100 pr-10 h-10"
                />
                <Terminal className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>

              <Button
                type="submit"
                disabled={isExplaining || !cmdInput}
                className="h-10 px-6 font-mono text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
              >
                {isExplaining ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Command...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    Explain Command
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CyberCard>

      {/* Results */}
      {explanationResult && !isExplaining && (
        <div className="space-y-6">
          {/* Header Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <CyberMetric
              title="Command Family"
              value={explanationResult.platform}
              accentColor="cyan"
              icon={<Terminal />}
            />
            <CyberMetric
              title="Execution Safety"
              value="SAFE (Diagnostic)"
              subtitle="Read-Only Telemetry"
              accentColor="emerald"
              icon={<CheckCircle2 />}
            />
            <CyberMetric
              title="Parameters Parsed"
              value={explanationResult.parameters.length}
              accentColor="blue"
              icon={<FileText />}
            />
            <CyberMetric
              title="CPU Impact Risk"
              value="MEDIUM"
              subtitle="Disable when done"
              accentColor="yellow"
              icon={<AlertTriangle />}
            />
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CyberCard className="p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>Command Purpose & Use Case Context</span>
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Target Command:</span>
                  <pre className="p-2.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                    {explanationResult.command}
                  </pre>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Operational Purpose:</span>
                  <p className="text-slate-200 font-sans leading-relaxed">{explanationResult.purpose}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Primary Use Case:</span>
                  <p className="text-slate-200 font-sans leading-relaxed">{explanationResult.useCase}</p>
                </div>

                <div className="p-3 rounded bg-yellow-950/20 border border-yellow-500/30 text-yellow-300">
                  <span className="font-bold block mb-1">Execution Risk Warning:</span>
                  {explanationResult.potentialRisks}
                </div>
              </div>
            </CyberCard>

            <CyberCard className="p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3">
                Parameter & Flag Breakdown
              </h3>

              <div className="space-y-2.5 font-mono text-xs">
                {explanationResult.parameters.map((p: any, idx: number) => (
                  <div key={idx} className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-bold text-cyan-400">{p.param}</span>
                    <p className="text-slate-300 text-[11px] font-sans">{p.description}</p>
                  </div>
                ))}

                <div className="pt-2">
                  <span className="text-slate-400 font-semibold block mb-1">Related Diagnostics Commands:</span>
                  <div className="space-y-1">
                    {explanationResult.relatedCommands.map((rc: string, idx: number) => (
                      <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {rc}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CyberCard>
          </div>

          {/* Correlation Panel */}
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
