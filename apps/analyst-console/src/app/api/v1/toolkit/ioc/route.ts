import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target } = body;

    if (!target) {
      return NextResponse.json({ error: 'Target IOC is required' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ioc: target,
      reputationScore: 88,
      threatClassification: 'MALICIOUS',
      firstSeen: '2026-02-14',
      lastSeen: '2026-09-16',
      relatedDomains: ['dark-command-node.ru'],
      cybermindAlerts: 4,
      cybermindInvestigations: 1,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'IOC analysis failed' }, { status: 500 });
  }
}
