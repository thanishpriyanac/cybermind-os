import { NextRequest } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

const WEBHOOK_SECRET = process.env.DEPLOY_WEBHOOK_SECRET || 'cybermind-deploy-2026';

export async function POST(req: NextRequest) {
  // Verify secret
  const secret = req.headers.get('x-deploy-secret') || req.nextUrl.searchParams.get('secret');
  if (secret !== WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deployScript = path.resolve(process.cwd(), '../../scripts/deploy.sh');

  // Run deploy script fully detached — won't kill itself when PM2 restarts
  exec(`nohup bash ${deployScript} > /dev/null 2>&1 &`, (error) => {
    if (error) console.error('[DEPLOY] Failed to start deploy script:', error);
  });

  return Response.json({
    status: '🚀 Deploy triggered',
    message: 'Running: git pull → nx build → pm2 restart',
    log: '/home/vellprint/CyberMind/cybermind-os/deploy.log',
  });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return POST(req);
}
