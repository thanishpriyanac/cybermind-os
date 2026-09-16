'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Search, 
  Copy, 
  CheckCircle2, 
  Bot, 
  Terminal, 
  Server, 
  ShieldCheck, 
  Activity,
  Code
} from 'lucide-react';
import { CyberPageHeader, CyberCard } from '../../../components/cybermind/CyberPrimitives';
import { CyberStatusBadge } from '../../../components/cybermind/CyberBadges';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

interface CheatEntry {
  category: 'FortiGate' | 'Windows' | 'Linux' | 'SOC' | 'Networking';
  title: string;
  command: string;
  description: string;
  tags: string[];
}

export default function SecurityCheatSheetsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const cheatEntries: CheatEntry[] = [
    {
      category: 'FortiGate',
      title: 'Debug IPsec VPN Phase 1 & 2 Negotiation',
      command: 'diagnose debug application ike -1\ndiagnose debug enable',
      description: 'Displays real-time ISAKMP/IKE negotiation logs for IPsec tunnels.',
      tags: ['fortigate', 'vpn', 'ipsec', 'debug'],
    },
    {
      category: 'FortiGate',
      title: 'Live Packet Sniffer (Filter Host & Port)',
      command: 'diagnose sniffer packet any "host 185.220.101.5 and port 443" 4 0 l',
      description: 'Captures live packets passing through any interface matching specific host and port.',
      tags: ['fortigate', 'sniffer', 'packet-capture'],
    },
    {
      category: 'FortiGate',
      title: 'Check High Availability (HA) Cluster Sync Status',
      command: 'diagnose sys ha status\ndiagnose sys ha checksum cluster',
      description: 'Verifies HA state, heartbeat synchronization, and checksum matching.',
      tags: ['fortigate', 'ha', 'cluster'],
    },
    {
      category: 'Windows',
      title: 'PowerShell Audit Suspicious Active Processes',
      command: 'Get-CimInstance Win32_Process | Select-Object ProcessId, Name, ExecutablePath, CommandLine',
      description: 'Lists all running Windows processes with exact command line execution parameters.',
      tags: ['windows', 'powershell', 'incident-response'],
    },
    {
      category: 'Windows',
      title: 'Query Failed Logon Events (EventID 4625)',
      command: 'Get-WinEvent -FilterHashtable @{LogName="Security"; Id=4625} -MaxEvents 20',
      description: 'Fetches recent failed logon attempts from the Windows Security audit log.',
      tags: ['windows', 'eventid', '4625', 'audit'],
    },
    {
      category: 'Linux',
      title: 'List Open Listening Ports with Process PIDs',
      command: 'sudo ss -tulpn',
      description: 'Displays all active TCP and UDP listening sockets and associated process binaries.',
      tags: ['linux', 'networking', 'ss', 'ports'],
    },
    {
      category: 'Linux',
      title: 'Inspect Authentication Failures Log',
      command: 'sudo grep "Failed password" /var/log/auth.log | tail -n 20',
      description: 'Parses SSH authentication failures from syslog.',
      tags: ['linux', 'ssh', 'auth-log'],
    },
    {
      category: 'SOC',
      title: 'MITRE ATT&CK Credential Dumping Triage (T1003)',
      command: 'Search Log: EventID=10 (Sysmon ProcessAccess) TargetImage="*lsass.exe"',
      description: 'Detects unauthorized process memory access targeting LSASS for credential harvesting.',
      tags: ['soc', 'mitre', 'lsass', 't1003'],
    },
    {
      category: 'Networking',
      title: 'Common Security Service Ports',
      command: '22: SSH | 53: DNS | 80: HTTP | 443: HTTPS | 3389: RDP | 8080: Alt-HTTP',
      description: 'Standard SOC reference for network service port numbers.',
      tags: ['networking', 'ports', 'reference'],
    },
  ];

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const filtered = cheatEntries.filter((item) => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <CyberPageHeader
        title="SOC & Infrastructure Security Command Reference Cheat Sheets"
        description="Searchable reference library for FortiGate CLI, Windows Event IDs, Linux Hardening, and SOC Incident Triage."
        breadcrumbs={[
          { label: 'Security Toolkit', href: '/toolkit/ioc-analyzer' },
          { label: 'Security Cheat Sheets' },
        ]}
        badge={<CyberStatusBadge status="HEALTHY" />}
      />

      {/* Category Tabs & Search Bar */}
      <CyberCard className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            {['ALL', 'FortiGate', 'Windows', 'Linux', 'SOC', 'Networking'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commands, flags, tags..."
              className="bg-slate-900 border-slate-800 font-mono text-xs text-slate-100 pr-8"
            />
            <Search className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5" />
          </div>
        </div>
      </CyberCard>

      {/* Grid of Cheat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item, idx) => (
          <CyberCard key={idx} className="p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {item.category}
                </span>
                <div className="flex items-center gap-1">
                  {item.tags.map((t, i) => (
                    <span key={i} className="text-[9px] font-mono text-slate-500">#{t}</span>
                  ))}
                </div>
              </div>

              <h4 className="text-sm font-bold font-mono text-slate-100">{item.title}</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">{item.description}</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="relative">
                <pre className="p-3 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                  {item.command}
                </pre>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  onClick={() => handleCopy(item.command, idx)}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs font-mono border-slate-700"
                >
                  {copiedIdx === idx ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Copy Command
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => router.push(`/toolkit/command-explainer?cmd=${encodeURIComponent(item.command)}`)}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs font-mono border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20"
                >
                  <Bot className="w-3.5 h-3.5 mr-1" />
                  Explain Command &rarr;
                </Button>
              </div>
            </div>
          </CyberCard>
        ))}
      </div>
    </div>
  );
}
