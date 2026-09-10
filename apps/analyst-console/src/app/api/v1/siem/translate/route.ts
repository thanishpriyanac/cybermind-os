import { NextResponse } from 'next/server';
import { translateThreatToMultiSiem } from '@/lib/siem-translator';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { title = 'Suspicious Execution Threat', indicator = 'powershell.exe' } = body;

    const rules = translateThreatToMultiSiem(title, indicator);

    return NextResponse.json({
      success: true,
      rules,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'SIEM translation failed' }, { status: 500 });
  }
}
