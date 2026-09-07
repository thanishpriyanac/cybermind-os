'use client';

import { useState } from 'react';
import { 
  BookOpen, 
  Play, 
  CheckCircle2, 
  ShieldAlert, 
  Zap, 
  Clock, 
  Settings2, 
  RefreshCw,
  Search,
  Server,
  Lock,
  Network,
  Cpu
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

interface Playbook {
  id: string;
  name: string;
  category: 'CONTAINMENT' | 'ENRICHMENT' | 'FORENSICS' | 'REMEDIATION';
  triggerType: 'AUTOMATIC' | 'MANUAL';
  description: string;
  executionsTotal: number;
  successRate: string;
  avgDuration: string;
  lastRun: string;
  enabled: boolean;
}

const INITIAL_PLAYBOOKS: Playbook[] = [
  {
    id: 'PB-ISOLATE-HOST',
    name: 'Automatic Network Host Quarantine',
    category: 'CONTAINMENT',
    triggerType: 'AUTOMATIC',
    description: 'Triggers on Ransomware Canary breach. Immediately injects SDN drop rules and isolates host from local subnets.',
    executionsTotal: 142,
    successRate: '100%',
    avgDuration: '0.8s',
    lastRun: '14 minutes ago',
    enabled: true,
  },
  {
    id: 'PB-REVOKE-CREDS',
    name: 'Active Session Invalidation & Password Reset',
    category: 'REMEDIATION',
    triggerType: 'AUTOMATIC',
    description: 'Forces OAuth token revocation, invalidates active JWT sessions, and flags AD user accounts for mandatory credential reset.',
    executionsTotal: 89,
    successRate: '98.8%',
    avgDuration: '1.4s',
    lastRun: '1 hour ago',
    enabled: true,
  },
  {
    id: 'PB-ENRICH-IP',
    name: 'Threat Intel & GeoIP Data Enrichment',
    category: 'ENRICHMENT',
    triggerType: 'AUTOMATIC',
    description: 'Queries AbuseIPDB, VirusTotal, and internal SIEM logs for attacker IP reputation scoring and WHOIS attribution.',
    executionsTotal: 2410,
    successRate: '99.9%',
    avgDuration: '0.3s',
    lastRun: '2 minutes ago',
    enabled: true,
  },
  {
    id: 'PB-SNAPSHOT-EBS',
    name: 'Cloud EBS Forensic Disk Volume Snapshot',
    category: 'FORENSICS',
    triggerType: 'MANUAL',
    description: 'Takes an immutable AWS/GCP cloud volume snapshot for offline memory analysis prior to host wipe.',
    executionsTotal: 34,
    successRate: '97.0%',
    avgDuration: '4.2s',
    lastRun: 'Yesterday',
    enabled: true,
  },
  {
    id: 'PB-SIEM-BLOCK-IP',
    name: 'Edge Gateway Firewall Rule Injection',
    category: 'CONTAINMENT',
    triggerType: 'MANUAL',
    description: 'Pushes temporary 24-hour IP drop rules directly to Cloudflare WAF and Palo Alto Perimeter Firewalls.',
    executionsTotal: 512,
    successRate: '100%',
    avgDuration: '1.1s',
    lastRun: '3 hours ago',
    enabled: true,
  },
];

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>(INITIAL_PLAYBOOKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const togglePlaybook = (id: string) => {
    setPlaybooks((prev) =>
      prev.map((pb) => (pb.id === id ? { ...pb, enabled: !pb.enabled } : pb))
    );
  };

  const handleRunPlaybook = (id: string, name: string) => {
    setExecutingId(id);
    setTimeout(() => {
      setExecutingId(null);
      setToastMessage(`✅ Playbook "${name}" executed successfully!`);
      setTimeout(() => setToastMessage(null), 4000);
    }, 1200);
  };

  const filteredPlaybooks = playbooks.filter((pb) => {
    const matchesCat = filterCategory === 'ALL' || pb.category === filterCategory;
    const matchesQuery =
      pb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pb.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pb.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-black font-semibold px-4 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-5">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" />
            SOAR Response Playbooks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automated security orchestration, active containment, and threat enrichment workflows.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Playbooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">5 Ready</div>
            <p className="text-xs text-muted-foreground mt-1">All triggers operational</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Automated Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">3,187</div>
            <p className="text-xs text-muted-foreground mt-1">Past 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">99.4%</div>
            <p className="text-xs text-emerald-500 mt-1">⚡ Zero playbook failures</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">1.2s</div>
            <p className="text-xs text-muted-foreground mt-1">Instant containment</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search playbooks or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted border border-border text-foreground text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'CONTAINMENT', 'ENRICHMENT', 'REMEDIATION', 'FORENSICS'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Playbook List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPlaybooks.map((pb) => (
          <Card key={pb.id} className="bg-card border-border hover:border-primary/50 transition-colors flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono text-xs text-primary font-semibold">{pb.id}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                    {pb.category}
                  </Badge>
                  <Badge
                    className={
                      pb.triggerType === 'AUTOMATIC'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                    }
                  >
                    {pb.triggerType}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-base font-semibold">{pb.name}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                {pb.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0 space-y-4">
              {/* Telemetry info */}
              <div className="grid grid-cols-3 gap-2 bg-muted/60 p-2.5 rounded-lg text-xs text-center border border-border/50">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Executions</span>
                  <span className="font-medium text-foreground">{pb.executionsTotal}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Success</span>
                  <span className="font-medium text-emerald-400">{pb.successRate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Avg Duration</span>
                  <span className="font-medium text-foreground">{pb.avgDuration}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Last run: {pb.lastRun}
                </span>

                <Button
                  size="sm"
                  disabled={executingId === pb.id}
                  onClick={() => handleRunPlaybook(pb.id, pb.name)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 text-xs"
                >
                  {executingId === pb.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" /> Run Playbook
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
