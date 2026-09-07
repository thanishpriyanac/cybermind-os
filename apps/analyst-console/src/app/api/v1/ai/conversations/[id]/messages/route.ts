import { NextResponse } from 'next/server';
import { copilotStore } from '@/lib/copilot-store';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = request.headers.get('x-tenant-id') || 'cybermind-master-tenant';
    const userId = request.headers.get('x-user-id') || 'admin@cybermind.local';

    // 1. Try forwarding to backend AI Gateway if running
    const backendEndpoints = [
      process.env.AI_GATEWAY_URL ? `${process.env.AI_GATEWAY_URL}/conversations/${id}/messages` : null,
      `http://127.0.0.1:3010/api/v1/ai/conversations/${id}/messages`,
      `http://127.0.0.1:3002/api/v1/ai/conversations/${id}/messages`,
      `http://127.0.0.1:3000/api/v1/ai/conversations/${id}/messages`,
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
          if (Array.isArray(data)) {
            return NextResponse.json(data);
          }
        }
      } catch (e) {
        // Continue to local store
      }
    }

    // 2. Return from local copilotStore
    const messages = copilotStore.getMessages(id);
    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
