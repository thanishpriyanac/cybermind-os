'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Globe, 
  Server, 
  Cloud, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  FileCheck
} from 'lucide-react';

export default function NewVaptAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [targetType, setTargetType] = useState<'web_app' | 'api' | 'network' | 'cloud'>('web_app');
  const [allowedPaths, setAllowedPaths] = useState('/api/v1/*, /login, /dashboard');
  const [excludedPaths, setExcludedPaths] = useState('/admin/internal-backups, /debug');
  const [authorizationReference, setAuthorizationReference] = useState('');
  const [confirmedBy, setConfirmedBy] = useState('lead-analyst@cybermind.local');
  const [authConfirmed, setAuthConfirmed] = useState(false);
  const [testProfile, setTestProfile] = useState<'PASSIVE' | 'STANDARD_AUTHORIZED' | 'FULL_AUTHORIZED'>('STANDARD_AUTHORIZED');

  const [validationError, setValidationError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const allowedArr = allowedPaths.split(',').map((s) => s.trim()).filter(Boolean);
      const excludedArr = excludedPaths.split(',').map((s) => s.trim()).filter(Boolean);

      const res = await api.post('/v1/vapt/assessments', {
        name,
        target,
        targetType,
        allowedPaths: allowedArr,
        excludedPaths: excludedArr,
        authorizationReference,
        confirmedBy,
        testProfile,
      });
      return res.data;
    },
    onSuccess: (data) => {
      router.push(`/vapt/${data.data.id}`);
    },
    onError: (err: any) => {
      setValidationError(err?.response?.data?.error || err?.message || 'Failed to create assessment');
    },
  });

  const handleNextStep = () => {
    setValidationError(null);
    if (step === 1) {
      if (!name.trim()) return setValidationError('Please enter an Assessment Name.');
      setStep(2);
    } else if (step === 2) {
      if (!target.trim()) return setValidationError('Please enter a Target URL or Host IP.');
      if (target.toLowerCase().includes('localhost') || target.includes('127.0.0.1') || target.includes('169.254')) {
        return setValidationError('SSRF Security Error: Loopback, localhost, and cloud metadata targets are strictly forbidden.');
      }
      setStep(3);
    } else if (step === 3) {
      if (!authorizationReference.trim()) return setValidationError('Authorization Reference ID is mandatory.');
      if (!confirmedBy.trim()) return setValidationError('Confirming Security Officer Email/ID is required.');
      if (!authConfirmed) return setValidationError('You must check the mandatory scope & authorization confirmation box.');
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/vapt">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Authorized VAPT Assessment Wizard</h1>
          <p className="text-xs text-muted-foreground">5-Step Authorization, Target Scope, and Test Profile Setup</p>
        </div>
      </div>

      {/* Wizard Progress Bar */}
      <div className="flex items-center justify-between border-b border-border pb-4 font-mono text-xs">
        {['1. Target', '2. Scope', '3. Authorization', '4. Profile', '5. Review'].map((label, idx) => {
          const s = idx + 1;
          const isActive = step === s;
          const isDone = step > s;
          return (
            <div key={label} className={`flex items-center gap-1.5 ${
              isActive ? 'text-primary font-bold' : isDone ? 'text-emerald-400 font-medium' : 'text-muted-foreground'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                isActive ? 'bg-primary text-black' : isDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-muted'
              }`}>{isDone ? '✓' : s}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          );
        })}
      </div>

      {validationError && (
        <Card className="border-red-500/40 bg-red-500/10">
          <CardContent className="p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{validationError}</span>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Target Type & Name */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 1: Assessment Target & Type</CardTitle>
            <CardDescription>Select target scope domain and assign assessment identifier.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Assessment Name</label>
              <Input
                placeholder="e.g. Core Payment Portal Security Audit Q3"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">Target Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { type: 'web_app', label: 'Web App', icon: Globe },
                  { type: 'api', label: 'API Endpoint', icon: Layers },
                  { type: 'network', label: 'Network Host', icon: Server },
                  { type: 'cloud', label: 'Cloud Scope', icon: Cloud },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setTargetType(item.type as any)}
                    className={`p-3 rounded-lg border text-left flex flex-col gap-2 transition-all ${
                      targetType === item.type
                        ? 'border-primary bg-primary/10 text-foreground font-bold'
                        : 'border-border bg-card/40 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${targetType === item.type ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Target URL & Scope Definition */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 2: Target Scope & Boundaries</CardTitle>
            <CardDescription>Define target hostname and explicit allowed/excluded paths (SSRF Protected).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Target Host / URL</label>
              <Input
                placeholder="https://app.example.com"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="font-mono text-xs"
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Loopback (`127.0.0.1`), private RFC1918 subnets, and cloud metadata (`169.254.169.254`) are strictly blocked.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Allowed Paths (Comma-separated)</label>
              <Input
                placeholder="/api/v1/*, /login, /dashboard"
                value={allowedPaths}
                onChange={(e) => setAllowedPaths(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Excluded Paths (Comma-separated)</label>
              <Input
                placeholder="/admin/internal-backups, /debug"
                value={excludedPaths}
                onChange={(e) => setExcludedPaths(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Server-Enforced Authorization Verification */}
      {step === 3 && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-emerald-400">
              <Lock className="mr-2 h-5 w-5" />
              Step 3: Security Authorization Confirmation
            </CardTitle>
            <CardDescription>Server-enforced authorization lock binding scope hash to ticket reference.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Authorization Ticket / Reference ID</label>
              <Input
                placeholder="e.g. AUTH-2026-SEC-8821"
                value={authorizationReference}
                onChange={(e) => setAuthorizationReference(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Confirming Security Officer Email/ID</label>
              <Input
                placeholder="sec-lead@cybermind.local"
                value={confirmedBy}
                onChange={(e) => setConfirmedBy(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="p-3 rounded-md bg-background/60 border border-emerald-500/30 flex items-start gap-3">
              <input
                type="checkbox"
                id="auth-check"
                checked={authConfirmed}
                onChange={(e) => setAuthConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="auth-check" className="text-xs text-foreground leading-relaxed">
                <strong>Mandatory Authorization Declaration:</strong> I confirm that target <code className="font-mono text-emerald-300">{target || 'target'}</code> is fully authorized for security assessment under ticket <code className="font-mono text-emerald-300">{authorizationReference || 'AUTH-ID'}</code>. A cryptographic SHA-256 scope hash will lock this authorization to current boundaries.
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Test Profile Selection */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 4: Select VAPT Test Profile</CardTitle>
            <CardDescription>Choose testing depth and execution bounds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                id: 'PASSIVE',
                title: 'Passive Assessment',
                desc: 'Audits HTTP security headers, TLS ciphers, cookie attributes, CORS policies, and public tech stack fingerprinting.',
                badge: 'Safe (Non-Intrusive)',
              },
              {
                id: 'STANDARD_AUTHORIZED',
                title: 'Standard Authorized Assessment',
                desc: 'Includes passive audits plus controlled input validation, OWASP Top 10 checks, and redacted proof-of-concept evidence.',
                badge: 'Recommended',
              },
              {
                id: 'FULL_AUTHORIZED',
                title: 'Full Authorized Assessment',
                desc: 'Comprehensive multi-stage security audit with deep SSRF/SQLi verification within strict scope bounds.',
                badge: 'Full Depth',
              },
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => setTestProfile(p.id as any)}
                className={`p-4 rounded-lg border cursor-pointer flex items-start justify-between gap-4 transition-all ${
                  testProfile === p.id ? 'border-primary bg-primary/10' : 'border-border bg-card/40 hover:bg-muted'
                }`}
              >
                <div>
                  <h4 className="font-bold text-sm text-foreground">{p.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                </div>
                <Badge variant={testProfile === p.id ? 'default' : 'outline'} className="shrink-0 text-[10px]">
                  {p.badge}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Final Review & Launch */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 5: Review & Authorize Launch</CardTitle>
            <CardDescription>Verify all assessment attributes before lock.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-muted/40 p-3 rounded-md border border-border">
              <div><span className="text-muted-foreground">Name:</span> {name}</div>
              <div><span className="text-muted-foreground">Target:</span> {target}</div>
              <div><span className="text-muted-foreground">Type:</span> {targetType}</div>
              <div><span className="text-muted-foreground">Profile:</span> {testProfile}</div>
              <div><span className="text-muted-foreground">Reference:</span> {authorizationReference}</div>
              <div><span className="text-muted-foreground">Officer:</span> {confirmedBy}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Controls */}
      <div className="flex justify-between items-center pt-2">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || createMutation.isPending}
        >
          Previous
        </Button>

        {step < 5 ? (
          <Button onClick={handleNextStep}>
            Next Step →
          </Button>
        ) : (
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileCheck className="mr-2 h-4 w-4" />
            )}
            Authorize & Launch VAPT Assessment
          </Button>
        )}
      </div>
    </div>
  );
}
