import { NextResponse } from 'next/server';
import { analyzePcapFile } from '@/lib/pcap-analyzer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { fileName = 'capture.pcap', fileContent = '' } = body;

    const analysis = analyzePcapFile(fileName, fileContent);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'PCAP analysis failed' }, { status: 500 });
  }
}
