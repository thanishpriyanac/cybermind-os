'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  LayoutDashboard, 
  ShieldAlert, 
  Activity, 
  Shield, 
  Globe, 
  Bot, 
  Server, 
  BookOpen, 
  FileText, 
  HeartPulse, 
  ShieldCheck, 
  Plus, 
  Lock, 
  X,
  Command
} from 'lucide-react';

export interface CyberCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CyberCommandPalette({ isOpen, onClose }: CyberCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  const navCommands = [
    { label: 'Go to Operations Dashboard', path: '/dashboard', category: 'NAVIGATION', icon: LayoutDashboard },
    { label: 'Go to Alerts Triage Workspace', path: '/alerts', category: 'NAVIGATION', icon: ShieldAlert },
    { label: 'Go to Security Investigations', path: '/investigations', category: 'NAVIGATION', icon: Activity },
    { label: 'Go to CyberAI Copilot Workspace', path: '/copilot', category: 'NAVIGATION', icon: Bot },
    { label: 'Go to CVE Vulnerability Intelligence', path: '/cve', category: 'NAVIGATION', icon: Shield },
    { label: 'Go to IP Threat Intelligence', path: '/ip', category: 'NAVIGATION', icon: Globe },
    { label: 'Go to VAPT Security Assessments', path: '/vapt', category: 'NAVIGATION', icon: Lock },
    { label: 'Go to Firewall Health Check', path: '/firewall', category: 'NAVIGATION', icon: Server },
    { label: 'Go to Response Playbooks', path: '/playbooks', category: 'NAVIGATION', icon: BookOpen },
    { label: 'Go to QBR Executive Reports', path: '/qbr', category: 'NAVIGATION', icon: FileText },
    { label: 'Go to System Health & Telemetry', path: '/health', category: 'NAVIGATION', icon: HeartPulse },
    { label: 'Go to Platform Admin Center', path: '/admin', category: 'NAVIGATION', icon: ShieldCheck },
    { label: 'Toolkit: IP Port Scanner', path: '/toolkit/ip-scanner', category: 'TOOLKIT', icon: Globe },
    { label: 'Toolkit: Central IOC Analyzer', path: '/toolkit/ioc-analyzer', category: 'TOOLKIT', icon: Activity },
    { label: 'Toolkit: URL Security Analyzer', path: '/toolkit/url-analyzer', category: 'TOOLKIT', icon: BookOpen },
    { label: 'Toolkit: Firewall Rule Analyzer', path: '/toolkit/firewall-rules', category: 'TOOLKIT', icon: Server },
    { label: 'Toolkit: Firewall Policy Simulator', path: '/toolkit/firewall-simulator', category: 'TOOLKIT', icon: Lock },
    { label: 'Toolkit: CVE Explainer', path: '/toolkit/cve-explainer', category: 'TOOLKIT', icon: Shield },
    { label: 'Toolkit: Security Log Analyzer', path: '/toolkit/log-analyzer', category: 'TOOLKIT', icon: FileText },
    { label: 'Toolkit: Log Converter / Normalizer', path: '/toolkit/log-converter', category: 'TOOLKIT', icon: Activity },
    { label: 'Toolkit: Active Directory Security Checker', path: '/toolkit/ad-checker', category: 'TOOLKIT', icon: ShieldCheck },
    { label: 'Toolkit: DNS Security Analyzer', path: '/toolkit/dns-analyzer', category: 'TOOLKIT', icon: Globe },
    { label: 'Toolkit: DNS Resolver Troubleshooter', path: '/toolkit/dns-troubleshooter', category: 'TOOLKIT', icon: Activity },
    { label: 'Toolkit: Network Connectivity Diagnostic', path: '/toolkit/connectivity-tester', category: 'TOOLKIT', icon: HeartPulse },
    { label: 'Toolkit: Traceroute Visualizer', path: '/toolkit/traceroute', category: 'TOOLKIT', icon: Activity },
    { label: 'Toolkit: PCAP Network Traffic Analyzer', path: '/toolkit/pcap-analyzer', category: 'TOOLKIT', icon: Server },
    { label: 'Toolkit: Security Reference Cheat Sheets', path: '/toolkit/cheatsheets', category: 'TOOLKIT', icon: BookOpen },
    { label: 'Toolkit: Explain This Command', path: '/toolkit/command-explainer', category: 'TOOLKIT', icon: Bot },
  ];

  const userRole = typeof window !== 'undefined' 
    ? (localStorage.getItem('user_role') || 'ADMIN').toUpperCase() 
    : 'ADMIN';
  const userEmail = typeof window !== 'undefined'
    ? (localStorage.getItem('email') || '').toLowerCase()
    : '';
  const isSaravanan = userEmail.includes('saravanan') || userRole === 'RESTRICTED_ANALYST';

  const quickActions = [
    { label: 'Launch New VAPT Security Assessment', path: '/vapt/new', category: 'ACTION', icon: Plus },
    { label: 'Start CyberAI Security Prompt', path: '/copilot', category: 'ACTION', icon: Bot },
    { label: 'Browse IP Blacklist Feed', path: '/ip/blacklist', category: 'ACTION', icon: Globe },
  ];

  const allItems = [...quickActions, ...navCommands];
  const filtered = allItems.filter((item) => {
    if (isSaravanan) {
      if (
        item.path.startsWith('/qbr') ||
        item.path.startsWith('/firewall') ||
        item.path.startsWith('/toolkit/firewall')
      ) {
        return false;
      }
    }
    return (
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.path.toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-border bg-muted/30">
          <Search className="w-5 h-5 text-primary shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            placeholder="Search CyberMind OS (CVE, IP, Alerts, VAPT, Pages, Actions...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-14 bg-transparent text-sm font-mono text-foreground focus:outline-none placeholder:text-muted-foreground"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Stream */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 divide-y divide-border/40 font-mono text-xs">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => (
              <div
                key={idx}
                onClick={() => navigateTo(item.path)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-primary/15 hover:text-primary transition-colors text-foreground group"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                  <span className="font-medium text-xs">{item.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground/70 font-mono">{item.path}</span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No matching commands found for &quot;{query}&quot;.
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 bg-muted/40 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-background border border-border text-foreground">ESC</kbd> to exit</span>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3 text-cyan-400" />
            <span>CyberMind Global Navigation</span>
          </span>
        </div>
      </div>
    </div>
  );
}
