export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { ingestCustomUrl } from '@/lib/learning-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, category } = body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    let parsedUrl = url.trim();
    if (!parsedUrl.startsWith('http://') && !parsedUrl.startsWith('https://')) {
      parsedUrl = `https://${parsedUrl}`;
    }

    const article = await ingestCustomUrl(parsedUrl, category);

    return NextResponse.json({
      success: true,
      message: `Successfully ingested custom feed ${parsedUrl}. Auto-tagged MITRE ATT&CK TTPs & updated model training dataset.`,
      article,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to ingest custom URL' }, { status: 500 });
  }
}
