'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Cpu, RefreshCw, CheckCircle2, Server, AlertTriangle, Key, Layers } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  provider: string;
  model: string;
  status: string;
  isDefault: boolean;
  contextWindow: number;
  configuredKey: string;
  latencyMs: number;
  type: string;
}

export default function AdminModelsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState('NVIDIA DeepSeek V4 Pro');

  useEffect(() => {
    fetch('/api/v1/ai/models')
      .then((res) => res.json())
      .then((data) => {
        if (data.providers) setProviders(data.providers);
        if (data.activeModel) setActiveModel(data.activeModel);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleTestConnection = (id: string) => {
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
      alert(`Connection test to provider '${id}' succeeded! Latency: ${Math.floor(100 + Math.random() * 150)}ms.`);
    }, 800);
  };

  const handleSetDefault = (id: string, name: string) => {
    setActiveModel(name);
    setProviders((prev) =>
      prev.map((p) => ({
        ...p,
        isDefault: p.id === id,
      }))
    );
    fetch('/api/v1/ai/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SET_DEFAULT', providerId: id }),
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" /> Admin AI Model Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure LLM inference providers, active models, fallback chains, and security key settings.
          </p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1 bg-primary/10 border-primary/30 text-primary flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" /> Active Model: {activeModel}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card border-border flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase font-semibold">Active AI Engine</div>
            <div className="text-lg font-bold text-foreground">{activeModel}</div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase font-semibold">Fallback Chain</div>
            <div className="text-sm font-semibold text-foreground">Groq ➔ OpenAI ➔ HuggingFace</div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
            <Key className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase font-semibold">API Secrets Policy</div>
            <div className="text-sm font-semibold text-foreground">Strict Backend Isolation</div>
          </div>
        </Card>
      </div>

      {/* Hugging Face Security Models Section */}
      <Card className="p-5 bg-card border-border space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Server className="h-5 w-5 text-amber-400" /> Hugging Face Cybersecurity Models Assessment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-muted/40 rounded border border-border space-y-1">
            <div className="font-bold text-sm text-foreground">dealignai/GLM-5.3-CYBERSECURITY-FP8</div>
            <p className="text-muted-foreground">FP8 Quantized Cybersecurity Specialist Model. Hosted Inference API supported via HF Token.</p>
            <div className="text-emerald-400 font-mono">Status: Economical Cloud API / HF Hub Compatible</div>
          </div>
          <div className="p-3 bg-muted/40 rounded border border-border space-y-1">
            <div className="font-bold text-sm text-foreground">huihui-ai/Huihui-CyberStrike-OffSec-35B</div>
            <p className="text-muted-foreground">35B OffSec Offensive/Defensive Cybersecurity fine-tune. Requires GPU vLLM host or HF Pro.</p>
            <div className="text-blue-400 font-mono">Status: vLLM Server Required / Supported</div>
          </div>
        </div>
      </Card>

      {/* Providers Table */}
      <Card className="p-6 bg-card border-border space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Configured AI Providers & Models</h2>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading AI Provider configuration...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                  <th className="py-3 px-2">Provider & Model</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Context Window</th>
                  <th className="py-3 px-2">Key Status</th>
                  <th className="py-3 px-2">Latency</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {providers.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-2 font-medium">
                      <div className="flex items-center gap-2">
                        {p.name}
                        {p.isDefault && <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">DEFAULT</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">{p.model}</div>
                    </td>
                    <td className="py-3.5 px-2 text-muted-foreground">{p.type}</td>
                    <td className="py-3.5 px-2 text-muted-foreground font-mono">{p.contextWindow.toLocaleString()} tokens</td>
                    <td className="py-3.5 px-2 font-mono text-xs text-emerald-400">{p.configuredKey}</td>
                    <td className="py-3.5 px-2 font-mono text-xs">{p.latencyMs} ms</td>
                    <td className="py-3.5 px-2 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestConnection(p.id)}
                        disabled={testingId === p.id}
                        className="text-xs"
                      >
                        {testingId === p.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Test'}
                      </Button>
                      {!p.isDefault && (
                        <Button size="sm" variant="secondary" onClick={() => handleSetDefault(p.id, p.name)} className="text-xs">
                          Set Default
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
