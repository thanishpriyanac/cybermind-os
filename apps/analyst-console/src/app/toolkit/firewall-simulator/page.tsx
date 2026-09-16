'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Lock, 
  Play, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Activity, 
  Bot, 
  ArrowRight,
  Server,
  Layers
} from 'lucide-react';
import { CyberPageHeader, CyberCard, CyberMetric } from '../../../components/cybermind/CyberPrimitives';
import { CyberSeverityBadge, CyberStatusBadge } from '../../../components/cybermind/CyberBadges';
import { CyberCorrelationPanel } from '../../../components/cybermind/CyberCorrelationPanel';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { SecurityObject } from '../../../lib/toolkit/types';
import { saveToolkitHistoryItem } from '../../../lib/toolkit/store';

export default function FirewallPolicySimulatorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [srcIp, setSrcIp] = useState(searchParams.get('src') || '10.10.10.20');
  const [dstIp, setDstIp] = useState(searchParams.get('dst') || '10.20.20.50');
  const [srcIntf, setSrcIntf] = useState('wan1');
  const [dstIntf, setDstIntf] = useState('dmz');
  const [protocol, setProtocol] = useState('TCP');
  const [dstPort, setDstPort] = useState(searchParams.get('port') || '443');

  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  useEffect(() => {
    handleRunSimulation();
  }, []);

  const handleRunSimulation = () => {
    setIsSimulating(true);

    setTimeout(() => {
      const isAllowed = dstPort === '443' || dstPort === '80';
      const matchedPolicy = isAllowed ? {
        policyId: 'Policy #17',
        policyName: 'DMZ-Web-Publish',
        action: 'ACCEPT',
        nat: 'Disabled',
        logging: 'Enabled (UTM Logged)',
        securityProfiles: 'AV (default), IPS (default)',
        evaluationOrder: [
          { ruleId: 'Policy #1', name: 'Internal-to-WAN', result: 'SKIPPED (Interface mismatch wan1 != internal)' },
          { ruleId: 'Policy #5', name: 'VPN-SSL-Access', result: 'SKIPPED (Source IP out of subnet range)' },
          { ruleId: 'Policy #17', name: 'DMZ-Web-Publish', result: 'MATCHED (wan1 -> dmz, dst 10.20.20.50 port 443)' },
        ],
      } : null;

      const res = {
        traffic: `${srcIp} [${srcIntf}] -> ${dstIp}:${dstPort} [${dstIntf}]`,
        protocol,
        action: isAllowed ? 'ACCEPT' : 'DENY (Implicit Deny)',
        matchedPolicy: matchedPolicy || {
          policyId: 'IMPLICIT_DENY',
          policyName: 'Default Deny All',
          action: 'DENY',
          nat: 'N/A',
          logging: 'Disabled',
          securityProfiles: 'None',
          evaluationOrder: [
            { ruleId: 'Policy #1', name: 'Internal-to-WAN', result: 'SKIPPED' },
            { ruleId: 'Policy #17', name: 'DMZ-Web-Publish', result: 'SKIPPED (Port mismatch)' },
            { ruleId: 'Rule #999', name: 'Implicit Deny All', result: 'MATCHED (Default drop)' },
          ],
        },
      };

      setSimResult(res);
      setIsSimulating(false);

      saveToolkitHistoryItem({
        toolId: 'firewall-simulator',
        toolName: 'Firewall Policy Simulator',
        target: `${srcIp} -> ${dstIp}:${dstPort}`,
        risk: isAllowed ? 'INFO' : 'HIGH',
        summaryText: `Simulated Traffic ${srcIp} -> ${dstIp}:${dstPort} — Result: ${res.action}`,
        data: res,
      });
    }, 900);
  };

  const selectedSecurityObject: SecurityObject | null = simResult ? {
    id: `obj-sim-${Date.now()}`,
    type: 'FIREWALL_RULE',
    value: simResult.matchedPolicy.policyId,
    source: 'Firewall Policy Simulator',
    timestamp: new Date().toISOString(),
    risk: simResult.action.includes('ACCEPT') ? 'LOW' : 'HIGH',
    confidence: 100,
    tags: ['policy-simulation', 'fortigate', 'traffic-analysis'],
    metadata: simResult,
  } : null;

  return (
    <div className="space-y-6">
      <CyberPageHeader
        title="Firewall Policy Traffic Simulator"
        description="Simulate network packet routing and policy evaluation order across FortiGate firewall rule tables."
        breadcrumbs={[
          { label: 'Security Toolkit', href: '/toolkit/ioc-analyzer' },
          { label: 'Firewall Policy Simulator' },
        ]}
        badge={<CyberStatusBadge status="ACTIVE" />}
      />

      {/* Input Parameters */}
      <CyberCard className="p-5">
        <form onSubmit={(e) => { e.preventDefault(); handleRunSimulation(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Source IP Address</label>
              <Input
                type="text"
                value={srcIp}
                onChange={(e) => setSrcIp(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs font-mono text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Destination IP Address</label>
              <Input
                type="text"
                value={dstIp}
                onChange={(e) => setDstIp(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs font-mono text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Destination Port</label>
              <Input
                type="text"
                value={dstPort}
                onChange={(e) => setDstPort(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs font-mono text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Source Interface</label>
              <Input
                type="text"
                value={srcIntf}
                onChange={(e) => setSrcIntf(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs font-mono text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Destination Interface</label>
              <Input
                type="text"
                value={dstIntf}
                onChange={(e) => setDstIntf(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs font-mono text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Transport Protocol</label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="w-full h-9 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 px-3"
              >
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ICMP">ICMP</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <Button
              type="submit"
              disabled={isSimulating}
              className="h-9 px-6 font-mono text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
            >
              {isSimulating ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Simulating Rule Match...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Simulate Packet Evaluation
                </>
              )}
            </Button>
          </div>
        </form>
      </CyberCard>

      {/* Results */}
      {simResult && !isSimulating && (
        <div className="space-y-6">
          {/* Decision Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <CyberMetric
              title="Simulation Decision"
              value={simResult.action}
              accentColor={simResult.action.includes('ACCEPT') ? 'emerald' : 'red'}
              icon={simResult.action.includes('ACCEPT') ? <CheckCircle2 /> : <XCircle />}
            />
            <CyberMetric
              title="Matched Policy"
              value={simResult.matchedPolicy.policyId}
              subtitle={simResult.matchedPolicy.policyName}
              accentColor="cyan"
              icon={<Server />}
            />
            <CyberMetric
              title="NAT Translation"
              value={simResult.matchedPolicy.nat}
              subtitle="IP Address Translation"
              accentColor="blue"
              icon={<Layers />}
            />
            <CyberMetric
              title="Logging Status"
              value={simResult.matchedPolicy.logging}
              accentColor="yellow"
              icon={<Activity />}
            />
          </div>

          {/* Rule Evaluation Order Timeline */}
          <CyberCard className="p-5 space-y-4">
            <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Firewall Rule Evaluation Sequence</span>
              <span className="text-xs text-slate-400 font-normal">Evaluated Top-to-Bottom</span>
            </h3>

            <div className="space-y-2 font-mono text-xs">
              {simResult.matchedPolicy.evaluationOrder.map((step: any, idx: number) => (
                <div key={idx} className={`p-3 rounded border flex items-center justify-between ${
                  step.result.includes('MATCHED') 
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="text-slate-200">{step.ruleId}:</span> {step.name}
                    </div>
                  </div>
                  <div className="text-xs">{step.result}</div>
                </div>
              ))}
            </div>
          </CyberCard>

          {/* Correlation Engine Panel */}
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
