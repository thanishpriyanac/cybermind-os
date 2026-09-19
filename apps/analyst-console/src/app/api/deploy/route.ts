export const runtime = 'nodejs';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const WEBHOOK_SECRET = process.env.DEPLOY_WEBHOOK_SECRET || 'cybermind-deploy-2026';

// On Cloudflare Workers edge runtime, there is no child_process.
// This endpoint just acknowledges the webhook — actual deployment
// is handled by a GitHub Actions runner or Cloudflare Pages CI trigger.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-deploy-secret') || req.nextUrl.searchParams.get('secret');
  if (secret !== WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({
    status: '🚀 Deploy webhook received',
    message: 'Deployment is handled via Cloudflare Pages CI / GitHub Actions.',
    timestamp: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return POST(req);
}
