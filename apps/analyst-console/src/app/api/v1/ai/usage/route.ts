import { usageTracker } from '../chat/stream/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(usageTracker.getStats());
}
