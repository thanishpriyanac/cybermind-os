import { NextResponse } from 'next/server';
import { ipStore } from '@/lib/ip-store';

const DEFAULT_ABUSEIPDB_KEY = '331d85893fe540622f192f9ccd5dc2caebdb5d5735c97b2402613b85c7d6f8cd570b96f7d0776c9f';

export async function GET() {
  try {
    const apiKey = process.env.ABUSEIPDB_API_KEY || DEFAULT_ABUSEIPDB_KEY;
    const configured = !!apiKey;
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
