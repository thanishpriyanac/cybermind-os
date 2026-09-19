export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

const WEBHOOK_SECRET = process.env.DEPLOY_WEBHOOK_SECRET || 'cybermind-deploy-2026';

async function triggerDeploy(): Promise<{ log: string; code: number }> {
  return new Promise((resolve) => {
    const scriptPath = path.resolve(process.cwd(), '../../scripts/deploy.sh');
    const child = exec(`bash "${scriptPath}"`, { timeout: 300_000 });

    let log = '';
    child.stdout?.on('data', (d) => { log += d; });
    child.stderr?.on('data', (d) => { log += d; });
    child.on('close', (code) => resolve({ log, code: code ?? -1 }));
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-deploy-secret') || req.nextUrl.searchParams.get('secret');
  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fire-and-forget — respond immediately, deploy runs in background
  triggerDeploy().catch(() => {/* ignore */});

  return NextResponse.json({
    status: 'ok',
    message: '🚀 Deploy triggered. Build running in background — check /api/v1/health after ~2 minutes.',
    timestamp: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return POST(req);
}
