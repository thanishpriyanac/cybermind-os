import { NextResponse } from 'next/server';
import { getOcrRecords, loadOcrStore } from '@/lib/ocr-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const store = loadOcrStore();
    const records = getOcrRecords(50);

    return NextResponse.json({
      success: true,
      totalScans: store.totalScans,
      totalIngested: store.totalIngested,
      lastScanAt: store.lastScanAt,
      records
    });
  } catch (error: any) {
    console.error('[API/OCR/HISTORY] Error fetching OCR scan history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve OCR scan history', details: error.message },
      { status: 500 }
    );
  }
}
