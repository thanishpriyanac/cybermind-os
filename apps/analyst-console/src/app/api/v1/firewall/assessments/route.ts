import { NextResponse } from 'next/server';
import { firewallStore } from '@/lib/firewall-store';

export async function GET() {
  try {
    const assessments = firewallStore.listAssessments();
    // Return summaries (omit full findings)
    const summaries = assessments.map(a => ({
      id: a.id,
      vendor: a.vendor,
      customerName: a.customerName,
      siteName: a.siteName,
      model: a.model,
      serialNumber: a.serialNumber,
      firmwareVersion: a.firmwareVersion,
      assessmentDate: a.assessmentDate,
      assessedBy: a.assessedBy,
      overallScore: a.overallScore,
      categoryScores: a.categoryScores,
      status: a.status,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      // Calculate basic stats for the summary
      stats: {
        total: a.findings.length,
        critical: a.findings.filter(f => f.status === 'FAIL' && a.findings.find(xf => xf.controlId === f.controlId)?.status === 'FAIL').length, // Simplification for summary
      }
    }));
    return NextResponse.json(summaries);
  } catch (error) {
    console.error('Failed to get assessments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vendor, customerName, siteName, model, serialNumber, firmwareVersion, assessedBy } = body;
    
    if (!vendor || !customerName || !siteName || !model || !firmwareVersion || !assessedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const assessment = firewallStore.createAssessment({
      vendor,
      customerName,
      siteName,
      model,
      serialNumber,
      firmwareVersion,
      assessedBy,
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error('Failed to create assessment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
