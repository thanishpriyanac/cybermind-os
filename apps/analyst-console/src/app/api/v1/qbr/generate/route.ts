import { NextResponse } from 'next/server';
import { generateExecutiveQbrReport, formatQbrHtmlReport } from '@/lib/qbr-generator';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { customerName = 'Enterprise Operations', format = 'json' } = body;

    const reportData = generateExecutiveQbrReport(customerName);

    if (format === 'html') {
      const html = formatQbrHtmlReport(reportData);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return NextResponse.json({
      success: true,
      report: reportData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'QBR Report generation failed' }, { status: 500 });
  }
}
