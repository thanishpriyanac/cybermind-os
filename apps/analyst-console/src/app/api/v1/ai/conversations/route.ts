import { NextResponse } from 'next/server';
import { copilotStore } from '@/lib/copilot-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'cybermind-master-tenant';
    const userId = request.headers.get('x-user-id') || 'admin@cybermind.local';

    // 1. Try forwarding to backend AI Gateway if running
    const backendEndpoints = [
      process.env.AI_GATEWAY_URL ? `${process.env.AI_GATEWAY_URL}/conversations` : null,
      'http://127.0.0.1:3010/api/v1/ai/conversations',
      'http://127.0.0.1:3002/api/v1/ai/conversations',
      'http://127.0.0.1:3000/api/v1/ai/conversations',
    ].filter(Boolean) as string[];

    for (const endpoint of backendEndpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);

        const backendRes = await fetch(endpoint, {
          headers: {
            'x-tenant-id': tenantId,
            'x-user-id': userId,
            'Authorization': request.headers.get('authorization') || '',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (backendRes.ok) {
          const data = await backendRes.json();
          if (Array.isArray(data) && data.length > 0) {
            return NextResponse.json(data);
          }
        }
      } catch (e) {
        // Backend not listening, continue to local store
      }
    }

    // 2. Return from local copilotStore
    const conversations = copilotStore.getConversations(tenantId, userId);
    return NextResponse.json(conversations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const tenantId = request.headers.get('x-tenant-id') || 'cybermind-master-tenant';
    const userId = request.headers.get('x-user-id') || 'admin@cybermind.local';

    const conv = copilotStore.createConversation({
      id: body.id,
      title: body.title || 'New Security Analysis',
      model: body.model || 'Auto (Smart Router)',
      modelKey: body.modelKey || 'auto',
      tenantId,
      userId,
    });

    return NextResponse.json(conv);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
