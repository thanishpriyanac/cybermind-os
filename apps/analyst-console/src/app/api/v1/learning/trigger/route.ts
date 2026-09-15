import { NextResponse } from 'next/server';
import { runUnrestrictedWebScraperPass, loadLearningStore } from '@/lib/learning-store';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const store = loadLearningStore();

    // Fire background scraping pass non-blocking so the API response returns instantly without socket timeouts or browser UI freeze
    runUnrestrictedWebScraperPass().catch((err) => {
      console.error('Background web scraping pass error:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Unrestricted web scraping pass triggered in background. Model training dataset is updating.',
      totalArticles: store.totalArticles,
      totalTrainingPairs: store.totalTrainingPairs,
      lastRunAt: new Date().toISOString(),
      status: 'active',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Scrape trigger failed' }, { status: 500 });
  }
}
