import { NextResponse } from 'next/server';
import { ipStore, IpInvestigation, IpReport } from '../../../../../lib/ip-store';
import crypto from 'crypto';

const CATEGORY_MAP: Record<number, string> = {
  1: 'DNS Compromise', 2: 'DNS Poisoning', 3: 'Fraud Orders', 4: 'DDoS Attack',
  5: 'FTP Brute-Force', 6: 'Ping of Death', 7: 'Phishing', 8: 'Fraud VoIP',
  9: 'Open Proxy', 10: 'Web Spam', 11: 'Email Spam', 12: 'Blog Spam',
  13: 'VPN IP', 14: 'Port Scan', 15: 'Hacking', 16: 'SQL Injection',
  17: 'Spoofing', 18: 'Brute Force', 19: 'Bad Web Bot', 20: 'Exploited Host',
  21: 'Web App Attack', 22: 'SSH', 23: 'IoT Targeted'
};

const CACHE = new Map<string, { time: number; data: IpInvestigation }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function POST(req: Request) {
  try {
    const { ip } = await req.json();

    if (!ip) {
      return NextResponse.json({ error: 'IP is required' }, { status: 400 });
    }

    const isIpv4 = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip);
    const isIpv6 = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i.test(ip) || ip.includes('::');
    
    if (!isIpv4 && !isIpv6) {
      return NextResponse.json({ error: 'Invalid IP address format' }, { status: 400 });
    }

    const apiKey = process.env.ABUSEIPDB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AbuseIPDB API key not configured', configured: false }, { status: 503 });
    }

    // Check rate limit cache
    const cached = CACHE.get(ip);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90&verbose=true`, {
      headers: {
        'Key': apiKey,
        'Accept': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`AbuseIPDB API Error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.data;

    let threatClassification: 'malicious' | 'suspicious' | 'low_risk' | 'clean' = 'clean';
    if (result.abuseConfidenceScore >= 80) threatClassification = 'malicious';
    else if (result.abuseConfidenceScore >= 40) threatClassification = 'suspicious';
    else if (result.abuseConfidenceScore >= 10) threatClassification = 'low_risk';

    const reports: IpReport[] = (result.reports || []).map((r: any) => ({
      reportedAt: r.reportedAt,
      comment: r.comment,
      categories: r.categories,
      categoryNames: r.categories.map((c: number) => CATEGORY_MAP[c] || `Unknown (${c})`)
    }));

    const investigation: IpInvestigation = {
      id: crypto.randomUUID(),
      ip: result.ipAddress,
      ipVersion: result.ipVersion,
      investigatedAt: new Date().toISOString(),
      abuseScore: result.abuseConfidenceScore,
      totalReports: result.totalReports,
      lastReported: result.lastReportedAt || null,
      isWhitelisted: result.isWhitelisted || false,
      countryCode: result.countryCode || '',
      countryName: result.countryName || '',
      isp: result.isp || '',
      domain: result.domain || '',
      usageType: result.usageType || '',
      threatClassification,
      reports,
      rawResponse: result
    };

    ipStore.addInvestigation(investigation);
    CACHE.set(ip, { time: Date.now(), data: investigation });

    return NextResponse.json(investigation);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return NextResponse.json({ error: 'Request to AbuseIPDB timed out' }, { status: 504 });
    }
    console.error('IP Lookup Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
