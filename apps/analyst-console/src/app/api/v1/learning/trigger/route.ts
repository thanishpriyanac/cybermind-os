export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { runUnrestrictedWebScraperPass, loadLearningStore } from '@/lib/learning-store';

export async function POST() {
  try {
    const updatedStore = await runUnrestrictedWebScraperPass();

    return NextResponse.json({
      success: true,
      message: 'Unrestricted web scraping pass completed. Model training dataset updated with live cybersecurity intelligence.',
      totalArticles: updatedStore.totalArticles,
      totalTrainingPairs: updatedStore.totalTrainingPairs,
      lastRunAt: updatedStore.lastRunAt,
      status: 'idle',
      liveLogs: updatedStore.liveLogs.slice(0, 10),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Scrape trigger failed' }, { status: 500 });
  }
}
