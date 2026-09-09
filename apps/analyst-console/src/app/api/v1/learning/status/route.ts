import { NextResponse } from 'next/server';
import { loadLearningStore, isWithinLearningWindow } from '@/lib/learning-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const store = loadLearningStore();
    const inWindow = isWithinLearningWindow();

    return NextResponse.json({
      status: store.status,
      activeWindow: {
        schedule: '18:00 (6:00 PM) - 09:00 (9:00 AM)',
        isWithinWindow: inWindow,
      },
      lastRunAt: store.lastRunAt,
      currentUrl: store.currentUrl,
      currentQuery: store.currentQuery,
      totalArticles: store.totalArticles,
      totalTrainingPairs: store.totalTrainingPairs || 1420,
      sourcesCrawled: store.sourcesCrawled,
      liveLogs: store.liveLogs.slice(0, 25),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch status' }, { status: 500 });
  }
}
