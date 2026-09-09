import { NextResponse } from 'next/server';
import { ipStore } from '@/lib/ip-store';

let blacklistCacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(req: Request) {
  try {
    const apiKey = process.env.ABUSEIPDB_API_KEY || '331d85893fe540622f192f9ccd5dc2caebdb5d5735c97b2402613b85c7d6f8cd570b96f7d0776c9f';
    if (!apiKey) {
      return NextResponse.json({ error: 'AbuseIPDB API key not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '1000', 10), 10000);
    const confidenceMinimum = parseInt(searchParams.get('confidenceMinimum') || '25', 10);
    const countryCode = searchParams.get('countryCode');

    // Only fetch from API if cache is expired
    if (Date.now() - blacklistCacheTime > CACHE_TTL) {
      const response = await fetch(`https://api.abuseipdb.com/api/v2/blacklist?confidenceMinimum=${confidenceMinimum}&limit=${limit}`, {
        headers: {
          'Key': apiKey,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`AbuseIPDB API Error: ${response.status}`);
      }

      const data = await response.json();
      ipStore.updateBlacklist(data.data);
      blacklistCacheTime = Date.now();
    }

    const filters: any = { limit, minConfidence: confidenceMinimum };
    if (countryCode) {
      filters.countryCode = countryCode;
    }

    const blacklist = ipStore.getBlacklist(filters);

    return NextResponse.json(blacklist);
  } catch (err: any) {
    console.error('IP Blacklist Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
