import { NextResponse } from 'next/server';
import { runWebScraperPass } from '@/lib/learning-store';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const updatedStore = await runWebScraperPass();
    return NextResponse.json({
      success: true,
      message: 'Web Learning Engine scrape pass completed.',
      totalArticles: updatedStore.totalArticles,
      lastRunAt: updatedStore.lastRunAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Scrape trigger failed' }, { status: 500 });
  }
}
