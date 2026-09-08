import { NextResponse } from 'next/server';
import { ipStore } from '../../../../../lib/ip-store';

export async function GET() {
  try {
    const configured = !!process.env.ABUSEIPDB_API_KEY;
    const status = ipStore.getStatus();
    
    return NextResponse.json({
      configured,
      investigationsCount: status.investigationsCount,
      lastBlacklistFetch: status.lastBlacklistFetch
    });
  } catch (err: any) {
    console.error('IP Status Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
