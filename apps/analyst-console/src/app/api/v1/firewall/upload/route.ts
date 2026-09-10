export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { parseFortiGateConfig, auditFortiGateConfig } from '@/lib/fortigate-parser';
import { firewallStore } from '@/lib/firewall-store';
import { getVendorControls } from '@/lib/vendors';
import { enforceApiPermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit-logger';

export async function POST(req: NextRequest) {
  // 1. RBAC Guard: Analyst or Admin required for config upload
  const rbacError = enforceApiPermission(req, 'config_upload', 'write');
  if (rbacError) return rbacError;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const customerName = (formData.get('customerName') as string) || 'Enterprise Client';
    const siteName = (formData.get('siteName') as string) || 'HQ Perimeter';

    if (!file) {
      return NextResponse.json({ error: 'No configuration file provided' }, { status: 400 });
    }

    // Security Check: File Size Limit (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds maximum permitted limit of 10MB' }, { status: 400 });
    }

    // Security Check: File Extension Check (.conf, .txt, .cfg)
    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.conf') && !filename.endsWith('.txt') && !filename.endsWith('.cfg')) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload a valid FortiGate configuration export (.conf, .txt, .cfg)' },
        { status: 400 }
      );
    }

    const rawText = await file.text();

    // Validate FortiGate config header
    if (!rawText.includes('config system') && !rawText.includes('#config-version') && !rawText.includes('set hostname')) {
      return NextResponse.json(
        { error: 'Unable to parse file. Content does not match FortiGate configuration structure.' },
        { status: 422 }
      );
    }

    // 2. Parse Configuration & Run Audits
    const parsed = parseFortiGateConfig(rawText);
    const findings = auditFortiGateConfig(parsed);

    // 3. Create Assessment Record & Calculate Weighted Health Scores
    const controls = getVendorControls('fortinet');
    const scores = firewallStore.calculateScores(findings, controls);

    const assessment = firewallStore.createAssessment({
      vendor: 'fortinet',
      customerName,
      siteName,
      model: parsed.model,
      serialNumber: parsed.serialNumber,
      firmwareVersion: parsed.firmware,
      assessedBy: 'CyberMind Automated Auditor',
    });

    // Update assessment with parsed findings and calculated scores
    const updatedAssessment = firewallStore.updateAssessment(assessment.id, {
      findings,
      overallScore: scores.overall,
      categoryScores: scores.byCategory,
      status: 'complete',
    });

    // 4. Log Security Audit Log
    logAuditEvent({
      action: 'FIREWALL_CONFIG_UPLOAD',
      module: 'FIREWALL_HEALTH',
      resource: file.name,
      result: 'SUCCESS',
      details: {
        assessmentId: assessment.id,
        model: parsed.model,
        firmware: parsed.firmware,
        overallScore: scores.overall,
      },
    });

    return NextResponse.json({
      success: true,
      assessmentId: assessment.id,
      assessment: updatedAssessment,
      parsedSummary: {
        hostname: parsed.hostname,
        model: parsed.model,
        firmware: parsed.firmware,
        serialNumber: parsed.serialNumber,
        policiesCount: parsed.policiesCount,
        anyAnyAllowRulesCount: parsed.anyAnyAllowRules.length,
      },
    });
  } catch (error: any) {
    console.error('Error handling firewall config upload:', error);
    return NextResponse.json(
      { error: 'Failed to process firewall configuration file', details: error?.message },
      { status: 500 }
    );
  }
}
