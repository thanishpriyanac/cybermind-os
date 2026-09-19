export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns/promises';
import { ipStore } from '@/lib/ip-store';
import { loadAlerts } from '@/lib/alert-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target } = body;

    if (!target || typeof target !== 'string' || !target.trim()) {
      return NextResponse.json({ error: 'Target IOC is required' }, { status: 400 });
    }

    const cleanTarget = target.trim();
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanTarget) || cleanTarget.includes(':');
    const isHash = /^[a-fA-F0-9]{32,64}$/.test(cleanTarget);

    let resolvedIps: string[] = [];
    let reverseHost: string | null = null;
    let reputationScore = 0;
    let threatClassification: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN' = 'CLEAN';

    const alerts = loadAlerts();
    const matchedAlerts = alerts.filter(a =>
      a.asset.toLowerCase().includes(cleanTarget.toLowerCase()) ||
      a.title.toLowerCase().includes(cleanTarget.toLowerCase())
    );

    if (isIp) {
      try {
        const hostnames = await dns.reverse(cleanTarget);
        reverseHost = hostnames[0] || null;
      } catch {
        reverseHost = null;
      }

      const localInv = ipStore.getInvestigation(cleanTarget);
      if (localInv) {
        reputationScore = localInv.abuseScore;
        threatClassification = (localInv.threatClassification.toUpperCase()) as any;
      }
    } else if (!isHash) {
      try {
        resolvedIps = await dns.resolve4(cleanTarget);
      } catch {
        try {
          const cnames = await dns.resolveCname(cleanTarget);
          reverseHost = cnames[0] || null;
        } catch {
          // unresolvable or nxdomain
        }
      }
    }

    if (matchedAlerts.length > 0) {
      threatClassification = 'MALICIOUS';
      reputationScore = Math.max(reputationScore, 85);
    }

    return NextResponse.json({
      success: true,
      ioc: cleanTarget,
      type: isIp ? 'IP' : isHash ? 'FILE_HASH' : 'DOMAIN',
      reputationScore,
      threatClassification,
      resolvedIps,
      reverseHost,
      cybermindAlerts: matchedAlerts.length,
      cybermindInvestigations: isIp ? (ipStore.getInvestigation(cleanTarget) ? 1 : 0) : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'IOC analysis failed' }, { status: 500 });
  }
}
