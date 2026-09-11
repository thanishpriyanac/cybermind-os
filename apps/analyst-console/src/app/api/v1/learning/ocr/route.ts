import { NextRequest, NextResponse } from 'next/server';
import { processImageOcr } from '@/lib/ocr-engine';
import { addOcrRecord } from '@/lib/ocr-store';
import { ingestOcrData } from '@/lib/learning-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { base64Data, imageUrl, rawText, filename, autoIngest } = body;

    if (!base64Data && !imageUrl && !rawText) {
      return NextResponse.json(
        { error: 'Image data (base64Data, imageUrl, or rawText) is required.' },
        { status: 400 }
      );
    }

    const cleanFilename = filename || (imageUrl ? imageUrl.split('/').pop() : 'threat_image.png');
    const ocrResult = await processImageOcr({ base64Data, imageUrl, rawText, filename: cleanFilename });

    let learningArticle = null;
    let ingestedToLearning = false;

    if (autoIngest) {
      learningArticle = ingestOcrData(ocrResult, cleanFilename);
      ingestedToLearning = true;
    }

    const ocrRecord = addOcrRecord({
      id: `ocr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      filename: cleanFilename,
      scannedAt: new Date().toISOString(),
      imageType: base64Data ? (base64Data.match(/^data:(image\/[a-z]+);/)?.[1] || 'image/png') : 'image/url',
      ocrResult,
      ingestedToLearning,
      learningArticleId: learningArticle?.id
    });

    return NextResponse.json({
      success: true,
      record: ocrRecord,
      result: ocrResult,
      ingestedArticle: learningArticle
    });
  } catch (error: any) {
    console.error('[API/OCR] OCR Processing Error:', error);
    return NextResponse.json(
      { error: 'Failed to process OCR request', details: error.message },
      { status: 500 }
    );
  }
}
