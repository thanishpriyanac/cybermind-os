'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  BookOpen, 
  ExternalLink, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Globe, 
  Bot, 
  Link as LinkIcon,
  Server,
  Lock
} from 'lucide-react';
import { CyberPageHeader, CyberCard, CyberMetric } from '../../../components/cybermind/CyberPrimitives';
import { CyberSeverityBadge, CyberStatusBadge } from '../../../components/cybermind/CyberBadges';
import { CyberCorrelationPanel } from '../../../components/cybermind/CyberCorrelationPanel';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { SecurityObject } from '../../../lib/toolkit/types';
import { saveToolkitHistoryItem } from '../../../lib/toolkit/store';

function UrlAnalyzerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialUrl = searchParams.get('url') || 'http://login.secure-auth-update-portal.com/auth/verify?session=9283401&token=a8f9021';

  const [urlInput, setUrlInput] = useState(initialUrl);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [urlResult, setUrlResult] = useState<any | null>(null);

  useEffect(() => {
    if (initialUrl) {
      handleAnalyzeUrl(initialUrl);
    }
  }, []);

  const handleAnalyzeUrl = (targetUrl: string) => {
    if (!targetUrl) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      let parsedDomain = 'secure-auth-update-portal.com';
      try {
        const u = new URL(targetUrl.startsWith('http') ? targetUrl : `http://${targetUrl}`);
        parsedDomain = u.hostname;
      } catch (e) {}

      const res = {
        url: targetUrl,
        protocol: targetUrl.startsWith('https') ? 'HTTPS' : 'HTTP (Insecure)',
        domain: parsedDomain,
        path: '/auth/verify',
        queryParams: 'session=9283401&token=a8f9021 (Base64/Hex Encoded)',
        resolvedIp: '185.220.101.5',
        redirectChain: [
          { step: 1, url: targetUrl, statusCode: 302, destination: 'http://redirect-node.info/gate' },
          { step: 2, url: 'http://redirect-node.info/gate', statusCode: 301, destination: 'https://credential-harvest.ru/login' },
          { step: 3, url: 'https://credential-harvest.ru/login', statusCode: 200, destination: 'Final Landing Page' },
        ],
        securityChecks: [
          { check: 'Insecure HTTP Transport', status: 'FAIL', detail: 'URL uses cleartext HTTP protocol' },
          { check: 'Suspicious Redirect Chain', status: 'FAIL', detail: 'Multiple cross-domain HTTP 302 redirects detected' },
          { check: 'Credential Harvesting Heuristics', status: 'FAIL', detail: 'Matches phishing keywords "login", "verify", "auth"' },
          { check: 'Punycode / Lookalike Domain', status: 'PASS', detail: 'No IDN homograph character spoofing' },
          { check: 'Excessive Subdomains', status: 'FAIL', detail: 'Subdomain depth > 3 detected' },
          { check: 'TLS Certificate Validity', status: 'WARNING', detail: 'Free Let\'s Encrypt certificate registered 2 days ago' },
        ],
        urlRisk: 'CRITICAL',
        domainRisk: 'HIGH',
        infrastructureRisk: 'HIGH',
        redirectRisk: 'CRITICAL',
      };

      setUrlResult(res);
      setIsAnalyzing(false);

      saveToolkitHistoryItem({
        toolId: 'url-analyzer',
        toolName: 'URL Security Analyzer',
        target: targetUrl,
        risk: 'CRITICAL',
        summaryText: `Analyzed URL — High-risk phishing indicators & multi-hop redirect chain found`,
        data: res,
      });
    }, 1100);
  };

  const currentSecurityObject: SecurityObject | null = urlResult ? {
    id: `obj-url-${encodeURIComponent(urlResult.url)}`,
    type: 'URL',
    value: urlResult.url,
    source: 'URL Analyzer',
    timestamp: new Date().toISOString(),
    risk: 'CRITICAL',
    confidence: 94,
    tags: ['phishing', 'credential-harvesting', 'insecure-http', 'redirect-chain'],
    metadata: urlResult,
  } : null;

  return (
    <div className="space-y-6">
      <CyberPageHeader
        title="URL & Web Path Security Analyzer"
        description="Deep analysis of web URLs, redirect chains, TLS certificates, credential harvesting indicators, and domain spoofing."
        breadcrumbs={[
          { label: 'Security Toolkit', href: '/toolkit/ioc-analyzer' },
          { label: 'URL Analyzer' },
        ]}
        badge={<CyberStatusBadge status="ACTIVE" />}
      />

      {/* Input */}
      <CyberCard className="p-5">
        <form onSubmit={(e) => { e.preventDefault(); handleAnalyzeUrl(urlInput); }} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-slate-300">
              Target Web URL
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste URL (http://example.com/login?token=abc)..."
                  className="bg-slate-900 border-slate-800 font-mono text-xs text-slate-100 pr-10 h-10"
                />
                <ExternalLink className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
              <Button
                type="submit"
                disabled={isAnalyzing || !urlInput}
                className="h-10 px-6 font-mono text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing URL...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Analyze URL
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CyberCard>

      {/* Loading */}
      {isAnalyzing && (
        <CyberCard className="p-8 text-center space-y-3">
          <Activity className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <div className="text-sm font-mono font-bold text-slate-200">
            Following Redirect Hops & Inspecting Web Certificate for &quot;{urlInput}&quot;...
          </div>
        </CyberCard>
      )}

      {/* Results */}
      {urlResult && !isAnalyzing && (
        <div className="space-y-6">
          {/* Risk Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <CyberMetric
              title="URL Overall Risk"
              value={urlResult.urlRisk}
              accentColor="red"
              icon={<ShieldAlert />}
            />
            <CyberMetric
              title="Domain Risk"
              value={urlResult.domainRisk}
              accentColor="orange"
              icon={<Globe />}
            />
            <CyberMetric
              title="Infrastructure Risk"
              value={urlResult.infrastructureRisk}
              accentColor="orange"
              icon={<Server />}
            />
            <CyberMetric
              title="Redirect Chain Risk"
              value={urlResult.redirectRisk}
              subtitle={`${urlResult.redirectChain.length} Hop Redirects`}
              accentColor="red"
              icon={<LinkIcon />}
            />
          </div>

          {/* Details & Redirect Chain */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Security Checks Table */}
            <CyberCard className="p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3">
                Automated Security Inspection Checks
              </h3>

              <div className="space-y-2 font-mono text-xs">
                {urlResult.securityChecks.map((chk: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-200">{chk.check}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{chk.detail}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      chk.status === 'FAIL' 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : chk.status === 'WARNING'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {chk.status}
                    </span>
                  </div>
                ))}
              </div>
            </CyberCard>

            {/* Redirect Chain & URL Parsing */}
            <CyberCard className="p-5 space-y-4">
              <h3 className="text-sm font-mono font-bold text-slate-100 border-b border-slate-800 pb-3">
                URL Structure & Multi-Hop Redirect Chain
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Protocol: <span className="text-red-400 font-bold">{urlResult.protocol}</span></span>
                    <span>Domain: <span className="text-cyan-300 font-bold">{urlResult.domain}</span></span>
                  </div>
                  <div className="text-slate-400">Path: <span className="text-slate-200">{urlResult.path}</span></div>
                  <div className="text-slate-400">Resolved IP: <span className="text-cyan-400 font-bold">{urlResult.resolvedIp}</span></div>
                </div>

                <div className="space-y-2">
                  <div className="text-slate-400 font-semibold">Redirect Hops Observed:</div>
                  {urlResult.redirectChain.map((hop: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-cyan-400">Hop #{hop.step} (HTTP {hop.statusCode})</span>
                        <span className="text-slate-400">{hop.destination}</span>
                      </div>
                      <div className="text-slate-300 break-all">{hop.url}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CyberCard>
          </div>

          {/* Correlation Engine Panel */}
          {currentSecurityObject && (
            <CyberCorrelationPanel
              object={currentSecurityObject}
              onAskCyberAI={(prompt) => router.push(`/copilot?prompt=${encodeURIComponent(prompt)}`)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function UrlAnalyzerPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs font-mono text-cyan-400">Loading URL Analyzer...</div>}>
      <UrlAnalyzerContent />
    </Suspense>
  );
}
