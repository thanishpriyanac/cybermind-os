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
import { VaptPageHeader } from '../../../components/vapt/VaptPageHeader';
import { VaptWizardProgress } from '../../../components/vapt/VaptWizardProgress';
import { 
  ArrowLeft, 
  Lock, 
  Globe, 
  Server, 
  Cloud, 
  Layers, 
  AlertTriangle, 
  Loader2,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  Shield
} from 'lucide-react';

export default function NewVaptAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [targetType, setTargetType] = useState<'web_app' | 'api' | 'network' | 'cloud'>('web_app');
  const [allowedPaths, setAllowedPaths] = useState('/api/v1/*, /login, /dashboard');
  const [excludedPaths, setExcludedPaths] = useState('/admin/internal-backups, /debug');
  const [authorizationReference, setAuthorizationReference] = useState('AUTH-2026-SEC-8821');
  const [confirmedBy, setConfirmedBy] = useState('lead-analyst@cybermind.local');
  const [authConfirmed, setAuthConfirmed] = useState(false);
  const [testProfile, setTestProfile] = useState<'PASSIVE' | 'STANDARD_AUTHORIZED' | 'FULL_AUTHORIZED'>('STANDARD_AUTHORIZED');

  const [validationError, setValidationError] = useState<string | null>(null);

  const wizardSteps = [
    { id: 1, title: '1. Target' },
    { id: 2, title: '2. Scope' },
    { id: 3, title: '3. Authorization' },
    { id: 4, title: '4. Profile' },
    { id: 5, title: '5. Review' },
  ];

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
      if (!authConfirmed) return setValidationError('You must check the mandatory scope & authorization confirmation declaration.');
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <VaptPageHeader
        title="New Authorized Assessment Wizard"
        subtitle="5-Step Authorization, Target Scope Boundaries, and Test Profile Setup"
        backHref="/vapt"
      />

      {/* Responsive Wizard Stepper */}
      <VaptWizardProgress currentStep={step} steps={wizardSteps} />

      {/* Validation Alert */}
      {validationError && (
        <Card className="border-red-500/40 bg-red-500/10">
          <CardContent className="p-3 text-xs text-red-300 flex items-center gap-2 font-mono">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{validationError}</span>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Target Type & Name */}
      {step === 1 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Step 1: Assessment Target & Identity</CardTitle>
            <CardDescription className="text-xs">Assign a descriptive assessment name and select target environment architecture.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5 font-mono">Assessment Name</label>
              <Input
                placeholder="e.g. Core Payment Gateway Security Audit"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs font-mono bg-card"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-2 font-mono">Target Architecture Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { type: 'web_app', label: 'Web Application', icon: Globe },
                  { type: 'api', label: 'API Endpoint', icon: Layers },
                  { type: 'network', label: 'Network Host', icon: Server },
                  { type: 'cloud', label: 'Cloud Scope', icon: Cloud },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setTargetType(item.type as any)}
                    className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                      targetType === item.type
                        ? 'border-primary bg-primary/10 text-foreground font-bold shadow-sm'
                        : 'border-border bg-card/40 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${targetType === item.type ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-mono">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Target URL & Scope Definition */}
      {step === 2 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Step 2: Target Scope & Boundaries</CardTitle>
            <CardDescription className="text-xs">Define target hostname and explicit allowed/excluded paths (SSRF Protected).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1 font-mono">Target Host / URL</label>
              <Input
                placeholder="https://api.example.com"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="font-mono text-xs bg-card"
              />
              <span className="text-[11px] text-muted-foreground mt-1 block font-mono">
                Loopback (`127.0.0.1`), RFC1918 internal subnets, and cloud metadata (`169.254.169.254`) are strictly blocked.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1 font-mono">Allowed Path Boundaries (Comma-separated)</label>
              <Input
                placeholder="/api/v1/*, /login, /dashboard"
                value={allowedPaths}
                onChange={(e) => setAllowedPaths(e.target.value)}
                className="font-mono text-xs bg-card"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1 font-mono">Excluded Path Boundaries (Comma-separated)</label>
              <Input
                placeholder="/admin/internal-backups, /debug"
                value={excludedPaths}
                onChange={(e) => setExcludedPaths(e.target.value)}
                className="font-mono text-xs bg-card"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Authorization Screen */}
      {step === 3 && (
        <Card className="border-emerald-500/40 bg-emerald-500/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-400" />
              <span>Step 3: Security Authorization Confirmation</span>
            </CardTitle>
            <CardDescription className="text-xs">Cryptographic scope lock binding authorization reference to assessment boundaries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1 font-mono">Authorization Ticket Reference</label>
                <Input
                  placeholder="AUTH-2026-SEC-8821"
                  value={authorizationReference}
                  onChange={(e) => setAuthorizationReference(e.target.value)}
                  className="font-mono text-xs bg-card"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1 font-mono">Confirming Security Officer Email/ID</label>
                <Input
                  placeholder="sec-lead@cybermind.local"
                  value={confirmedBy}
                  onChange={(e) => setConfirmedBy(e.target.value)}
                  className="font-mono text-xs bg-card"
                />
              </div>
            </div>

            {/* Scope Summary Box */}
            <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs font-mono space-y-1">
              <div><span className="text-muted-foreground">Target:</span> <strong className="text-foreground">{target || 'api.example.com'}</strong></div>
              <div><span className="text-muted-foreground">Allowed Scope:</span> <span className="text-cyan-300">{allowedPaths}</span></div>
              <div><span className="text-muted-foreground">Excluded Scope:</span> <span className="text-red-300">{excludedPaths}</span></div>
            </div>

            {/* Mandatory Checkbox Declaration with 44px Accessible Touch Target */}
            <div className="p-4 rounded-xl bg-card border border-emerald-500/40 flex items-start gap-3">
              <input
                type="checkbox"
                id="auth-check"
                checked={authConfirmed}
                onChange={(e) => setAuthConfirmed(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary shrink-0 cursor-pointer"
              />
              <label htmlFor="auth-check" className="text-xs text-foreground leading-relaxed cursor-pointer font-sans">
                <strong>Mandatory Authorization Confirmation:</strong> I confirm that target <code className="font-mono text-emerald-300">{target || 'target'}</code> is fully authorized for security testing under ticket <code className="font-mono text-emerald-300">{authorizationReference || 'AUTH-ID'}</code>. A SHA-256 scope lock hash will bind this authorization to assessment boundaries.
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Test Profile Selection */}
      {step === 4 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Step 4: Select VAPT Test Profile</CardTitle>
            <CardDescription className="text-xs">Choose assessment depth, testing type, expected impact, and approximate duration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                id: 'PASSIVE',
                title: 'PASSIVE ASSESSMENT',
                badge: 'Safe (Non-Intrusive)',
                duration: '~ 2-5 Minutes',
                type: 'Configuration & Posture',
                desc: 'Audits HTTP security headers, TLS ciphers, cookie flags, CORS policies, and public tech stack fingerprinting.',
              },
              {
                id: 'STANDARD_AUTHORIZED',
                title: 'STANDARD AUTHORIZED ASSESSMENT',
                badge: 'Recommended',
                duration: '~ 5-10 Minutes',
                type: 'Controlled Penetration Test',
                desc: 'Includes passive audits plus controlled input validation, OWASP Top 10 checks, and redacted proof-of-concept evidence.',
              },
              {
                id: 'FULL_AUTHORIZED',
                title: 'FULL AUTHORIZED ASSESSMENT',
                badge: 'Full Depth',
                duration: '~ 10-15 Minutes',
                type: 'Comprehensive Security Audit',
                desc: 'Deep multi-stage security audit with SSRF/SQLi verification, CVE correlations, and developer remediation playbooks.',
              },
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => setTestProfile(p.id as any)}
                className={`p-4 rounded-xl border cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                  testProfile === p.id 
                    ? 'border-primary bg-primary/10 shadow-sm' 
                    : 'border-border bg-card/40 hover:bg-muted'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground font-mono">{p.title}</span>
                    <Badge variant={testProfile === p.id ? 'default' : 'outline'} className="text-[10px] font-mono">
                      {p.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-cyan-400 pt-1">
                    <span>Type: {p.type}</span>
                    <span>Duration: {p.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Review & Authorize Launch */}
      {step === 5 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Step 5: Review & Authorize Launch</CardTitle>
            <CardDescription className="text-xs">Verify all assessment metadata before locking cryptographic authorization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-muted/40 p-4 rounded-xl border border-border">
              <div><span className="text-muted-foreground">Assessment Name:</span> <strong className="text-foreground">{name}</strong></div>
              <div><span className="text-muted-foreground">Target Host:</span> <strong className="text-cyan-300">{target}</strong></div>
              <div><span className="text-muted-foreground">Scope Architecture:</span> <span className="capitalize">{targetType?.replace('_', ' ')}</span></div>
              <div><span className="text-muted-foreground">Test Profile:</span> <span className="text-primary font-bold">{testProfile}</span></div>
              <div><span className="text-muted-foreground">Auth Reference:</span> <span className="text-emerald-400 font-bold">{authorizationReference}</span></div>
              <div><span className="text-muted-foreground">Authorized By:</span> <span className="text-foreground">{confirmedBy}</span></div>
            </div>

            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Authorization verified. Target scope will be locked upon assessment execution.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Controls (Min 44px Height Buttons) */}
      <div className="flex justify-between items-center pt-2 gap-4">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || createMutation.isPending}
          className="h-11 px-5 font-mono text-xs"
        >
          Previous
        </Button>

        {step < 5 ? (
          <Button onClick={handleNextStep} className="h-11 px-6 font-mono text-xs font-bold bg-primary text-black">
            Continue →
          </Button>
        ) : (
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="h-11 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 shadow-lg"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileCheck className="h-4 w-4" />
            )}
            <span>Authorize & Launch VAPT Assessment</span>
          </Button>
        )}
      </div>
    </div>
  );
}
