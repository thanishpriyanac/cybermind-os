import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const filename = file.name;
    const size = file.size;
    const extension = filename.split('.').pop()?.toLowerCase() || '';

    let detectedType = 'document';
    if (['pcap', 'pcapng', 'cap'].includes(extension)) {
      detectedType = 'pcap';
    } else if (['yaml', 'yml', 'json', 'conf', 'rules', 'sigma'].includes(extension)) {
      detectedType = 'config';
    } else if (['log', 'txt', 'csv', 'evtx'].includes(extension)) {
      detectedType = 'log';
    }

    let textPreview = '';
    if (size < 500_000 && detectedType !== 'pcap') {
      try {
        textPreview = await file.text();
      } catch {
        // binary or unreadable
      }
    }

    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    return NextResponse.json({
      success: true,
      fileId,
      filename,
      size,
      detectedType,
      preview: textPreview.slice(0, 1000),
      uploadedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
