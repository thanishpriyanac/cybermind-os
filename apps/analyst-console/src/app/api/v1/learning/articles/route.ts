import { NextResponse } from 'next/server';
import { loadLearningStore } from '@/lib/learning-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const store = loadLearningStore();
    let articles = store.articles;

    if (category) {
      articles = articles.filter(a => a.category.toUpperCase() === category.toUpperCase());
    }

    if (search) {
      const q = search.toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q) ||
        (a.cveId && a.cveId.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({
      data: articles,
      total: articles.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch articles' }, { status: 500 });
  }
}
