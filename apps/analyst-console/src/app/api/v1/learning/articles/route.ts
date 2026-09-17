export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { loadLearningStore } from '@/lib/learning-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limitParam = searchParams.get('limit') || searchParams.get('pageLimit');
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 500) : 50;

    const store = loadLearningStore();
    let articles = store.articles || [];

    if (category) {
      articles = articles.filter(a => a.category?.toUpperCase() === category.toUpperCase());
    }

    if (search) {
      const q = search.toLowerCase();
      articles = articles.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.summary?.toLowerCase().includes(q) ||
        a.source?.toLowerCase().includes(q) ||
        (a.cveId && a.cveId.toLowerCase().includes(q))
      );
    }

    const total = articles.length;
    const startIndex = (page - 1) * limit;
    const paginatedArticles = articles.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      data: paginatedArticles,
      total,
      page,
      limit,
      hasMore: startIndex + limit < total,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch articles' }, { status: 500 });
  }
}
