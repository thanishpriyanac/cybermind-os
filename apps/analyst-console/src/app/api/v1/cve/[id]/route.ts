import { NextRequest, NextResponse } from 'next/server';
import { getCveById } from '@/lib/cve-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let cve: any = getCveById(id);

  if (!cve && id.toUpperCase().startsWith('CVE-')) {
    try {
      const nvdRes = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(id.toUpperCase())}`, {
        headers: { 'User-Agent': 'CyberMind-OS/2.0' },
        next: { revalidate: 3600 },
      });
      if (nvdRes.ok) {
        const data = await nvdRes.json();
        if (data?.vulnerabilities?.[0]?.cve) {
          const item = data.vulnerabilities[0].cve;
          cve = {
            id: item.id,
            sourceIdentifier: item.sourceIdentifier || 'nvd@nist.gov',
            published: item.published || new Date().toISOString(),
            lastModified: item.lastModified || new Date().toISOString(),
            vulnStatus: item.vulnStatus || 'Analyzed',
            descriptions: item.descriptions || [{ lang: 'en', value: 'No description available from NVD.' }],
            metrics: item.metrics || {},
            weaknesses: item.weaknesses || [],
            references: item.references || [],
            affectedProducts: item.configurations?.nodes?.flatMap((n: any) => n.cpeMatch?.map((c: any) => c.criteria)) || [],
          };
        }
      }
    } catch (e) {
      console.warn('Live NVD fetch error for', id, e);
    }
  }

  if (!cve) {
    return NextResponse.json({ error: `CVE ${id} not found in NVD or local catalog` }, { status: 404 });
  }

  return NextResponse.json(cve);
}
