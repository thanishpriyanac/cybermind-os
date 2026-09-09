import { NextResponse } from 'next/server';
import { runUnrestrictedWebScraperPass } from '@/lib/learning-store';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const updatedStore = await runUnrestrictedWebScraperPass();
    return NextResponse.json({
      success: true,
      message: 'Unrestricted web scraping pass completed. Model training dataset updated.',
      totalArticles: updatedStore.totalArticles,
      totalTrainingPairs: updatedStore.totalTrainingPairs,
      lastRunAt: updatedStore.lastRunAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Scrape trigger failed' }, { status: 500 });
  }
}
