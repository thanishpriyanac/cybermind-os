import { NextRequest } from 'next/server';
import { qbrStore } from '@/lib/qbr-store';
import { firewallStore } from '@/lib/firewall-store';
import { getVendorControls } from '@/lib/vendors';

export async function GET() {
  const reports = qbrStore.listReports();
  return Response.json({ success: true, data: reports });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assessmentId, preparedBy, executiveSummary } = body;

    const assessment = firewallStore.getAssessment(assessmentId);
    if (!assessment) {
      return Response.json({ success: false, error: 'Assessment not found' }, { status: 404 });
    }

    const controls = getVendorControls(assessment.vendor);
    
    const findings = assessment.findings.map(f => {
      const c = controls.find(c => c.id === f.controlId);
      return {
        controlId: f.controlId,
        category: c?.category || 'General',
        name: c?.name || 'Unknown',
        severity: c?.severity || 'LOW',
        status: f.status,
        observation: f.actualConfig,
        risk: c?.description || '',
        recommendation: c?.expectedConfig || '',
        evidence: f.evidence
      };
    }).filter(f => f.status !== 'PASS' && f.status !== 'NOT_APPLICABLE');

    const remediationPlan = findings.map(f => {
      let priority: 'immediate' | 'short_term' | 'long_term' = 'long_term';
      if (f.status === 'FAIL') {
        if (f.severity === 'CRITICAL' || f.severity === 'HIGH') priority = 'immediate';
        else if (f.severity === 'MEDIUM') priority = 'short_term';
      }
      
      const targetDate = new Date();
      if (priority === 'immediate') targetDate.setDate(targetDate.getDate() + 7);
      else if (priority === 'short_term') targetDate.setDate(targetDate.getDate() + 30);
      else targetDate.setDate(targetDate.getDate() + 90);

      return {
        priority,
        finding: f.name,
        recommendation: f.recommendation,
        targetDate: targetDate.toISOString().split('T')[0],
        status: 'open' as const
      };
    });

    const report = qbrStore.createReport({
      assessmentId: assessment.id,
      customerName: assessment.customerName,
      siteName: assessment.siteName,
      vendor: assessment.vendor,
      model: assessment.model,
      serialNumber: assessment.serialNumber,
      firmwareVersion: assessment.firmwareVersion,
      assessmentDate: assessment.assessmentDate,
      reportDate: new Date().toISOString(),
      preparedBy: preparedBy || assessment.assessedBy,
      overallScore: assessment.overallScore,
      categoryScores: assessment.categoryScores,
      executiveSummary: executiveSummary || '',
      findings,
      remediationPlan,
      status: 'draft'
    });

    return Response.json({ success: true, data: report });
  } catch (error) {
    return Response.json({ success: false, error: 'Failed to create QBR report' }, { status: 500 });
  }
}
