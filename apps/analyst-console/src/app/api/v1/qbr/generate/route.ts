import { NextRequest, NextResponse } from 'next/server';
import { generateExecutiveQbrReport, generateFirewallQbrReport, formatQbrHtmlReport, generateFortiGateStructuredJsonQbrReport } from '@/lib/qbr-generator';
import { firewallStore } from '@/lib/firewall-store';
import { enforceApiPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1. RBAC Check: Analyst or Admin allowed to generate QBRs
  const rbacError = enforceApiPermission(request, 'qbr', 'write');
  if (rbacError) return rbacError;

  try {
    const body = await request.json().catch(() => ({}));
    const { assessmentId, customerName = 'Enterprise Operations', format = 'json' } = body;

    let targetAssessment;
    if (assessmentId) {
      targetAssessment = firewallStore.getAssessment(assessmentId);
      if (!targetAssessment) {
        return NextResponse.json({ error: `Assessment ID '${assessmentId}' not found` }, { status: 404 });
      }
    } else {
      const assessments = firewallStore.listAssessments();
      if (assessments.length > 0) {
        targetAssessment = assessments[0];
      }
    }

    if (format === 'json-structured' || format === 'schema') {
      const structuredJson = generateFortiGateStructuredJsonQbrReport(targetAssessment, body);
      return NextResponse.json(structuredJson);
    }

    const reportData = targetAssessment ? generateFirewallQbrReport(targetAssessment) : generateExecutiveQbrReport(customerName);

    // Log Audit Event
    logAuditEvent({
      action: 'QBR_REPORT_GENERATED',
      module: 'QBR_REPORTS',
      resource: reportData.reportId,
      result: 'SUCCESS',
      details: {
        customerName: reportData.customerName,
        overallScore: reportData.overallHealthScore,
        format,
      },
    });

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
    console.error('QBR generation error:', error);
    return NextResponse.json({ error: error.message || 'QBR Report generation failed' }, { status: 500 });
  }
}
