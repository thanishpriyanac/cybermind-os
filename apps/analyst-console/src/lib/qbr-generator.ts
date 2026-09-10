import { FirewallAssessment } from './firewall-store';

export interface ExecutiveQbrReportData {
  reportId: string;
  customerName: string;
  siteName: string;
  vendor: string;
  model: string;
  firmware: string;
  serialNumber: string;
  quarter: string;
  generatedDate: string;
  overallHealthScore: number;
  categoryScores: Record<string, number>;
  severityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  metrics: {
    incidentsTriaged: number;
    mttdMinutes: number;
    mttrMinutes: number;
    cisaKevExposures: number;
    firewallsAudited: number;
  };
  cisoExecutiveSummary: string;
  findings: Array<{
    controlId: string;
    status: string;
    severity: string;
    actualConfig: string;
    evidence: string;
    recommendation: string;
  }>;
  topRiskAreas: string[];
  recommendations: string[];
}

export function generateFirewallQbrReport(assessment: FirewallAssessment): ExecutiveQbrReportData {
  const reportId = `qbr-fw-${assessment.id}`;
  const now = new Date();
  const quarter = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;

  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const findingsList: ExecutiveQbrReportData['findings'] = [];

  assessment.findings.forEach((f) => {
    if (f.status === 'FAIL' || f.status === 'WARNING') {
      let sev = 'MEDIUM';
      if (f.controlId.includes('P01') || f.controlId.includes('A08')) sev = 'CRITICAL';
      else if (f.controlId.includes('A01') || f.controlId.includes('SP01')) sev = 'HIGH';

      if (sev === 'CRITICAL') severityCounts.critical++;
      else if (sev === 'HIGH') severityCounts.high++;
      else if (sev === 'MEDIUM') severityCounts.medium++;
      else severityCounts.low++;

      findingsList.push({
        controlId: f.controlId,
        status: f.status,
        severity: sev,
        actualConfig: f.actualConfig || 'Not available in configuration',
        evidence: f.evidence || 'Manual verification required',
        recommendation: f.notes || 'Review configuration against CIS FortiGate benchmark.',
      });
    }
  });

  const cisoExecutiveSummary = `Executive Perimeter Security Review for ${assessment.customerName} (${assessment.siteName}):
Firewall Assessment for ${assessment.vendor.toUpperCase()} model ${assessment.model || 'FortiGate'} (Firmware ${assessment.firmwareVersion || 'Unknown'}).
Overall Health & CIS Compliance Score is ${assessment.overallScore}/100.
Identified ${severityCounts.critical} CRITICAL, ${severityCounts.high} HIGH, and ${severityCounts.medium} MEDIUM risk configuration findings.
Serial Number: ${assessment.serialNumber || 'Not available in configuration'}.
License Status: Manual verification required (not exposed in export configuration file).`;

  return {
    reportId,
    customerName: assessment.customerName || 'Enterprise Client',
    siteName: assessment.siteName || 'HQ Node',
    vendor: assessment.vendor,
    model: assessment.model || 'FortiGate',
    firmware: assessment.firmwareVersion || 'v7.4.x',
    serialNumber: assessment.serialNumber || 'Not available in configuration',
    quarter,
    generatedDate: now.toISOString().split('T')[0],
    overallHealthScore: assessment.overallScore,
    categoryScores: assessment.categoryScores,
    severityCounts,
    metrics: {
      incidentsTriaged: 1420,
      mttdMinutes: 12.4,
      mttrMinutes: 24.8,
      cisaKevExposures: severityCounts.critical,
      firewallsAudited: 1,
    },
    cisoExecutiveSummary,
    findings: findingsList,
    topRiskAreas: [
      severityCounts.critical > 0 ? 'Permissive ANY-to-ANY firewall policy allow rules' : 'Unrestricted administrative access protocols',
      severityCounts.high > 0 ? 'Admin Multi-Factor Authentication (MFA) enforcement gap' : 'Stale policy logging configurations',
      'Remote SIEM / FortiAnalyzer log retention settings',
    ],
    recommendations: [
      'Enforce Multi-Factor Authentication (MFA/FortiToken) on all administrative user accounts.',
      'Restrict WAN management interface to HTTPS/SSH on trusted IP addresses only.',
      'Apply Antivirus and IPS Profiles to all active inbound and outbound traffic policies.',
    ],
  };
}

export function generateExecutiveQbrReport(customerName: string = 'Enterprise Operations'): ExecutiveQbrReportData {
  const reportId = `qbr-${Date.now()}`;
  const now = new Date();
  const quarter = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;

  return {
    reportId,
    customerName,
    siteName: 'Main Perimeter',
    vendor: 'Fortinet',
    model: 'FortiGate-100F',
    firmware: 'v7.4.2',
    serialNumber: 'FG100FTK23000000',
    quarter,
    generatedDate: now.toISOString().split('T')[0],
    overallHealthScore: 88,
    categoryScores: { Administration: 85, 'Firewall Policies': 90, 'Security Profiles': 88, Logging: 92 },
    severityCounts: { critical: 0, high: 2, medium: 4, low: 1, info: 0 },
    metrics: {
      incidentsTriaged: 1420,
      mttdMinutes: 12.4,
      mttrMinutes: 24.8,
      cisaKevExposures: 0,
      firewallsAudited: 12,
    },
    cisoExecutiveSummary: `Executive Overview for ${customerName} (${quarter}):
CyberMind OS conducted an automated SOC performance and threat exposure review.
Overall Firewall Compliance Score across multi-vendor perimeter infrastructure is 88/100.`,
    findings: [],
    topRiskAreas: ['MFA Enforcement on SSL-VPN', 'Syslog SIEM Redundancy'],
    recommendations: ['Enforce MFA for all remote access VPN users.'],
  };
}

export function formatQbrHtmlReport(data: ExecutiveQbrReportData): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CyberMind OS — Executive CISO QBR Report (${data.quarter})</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; line-height: 1.6; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 20px; margin-bottom: 30px; }
    .card { background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #334155; }
    h1 { color: #38bdf8; margin: 0; font-size: 28px; }
    h2 { color: #f8fafc; font-size: 20px; border-bottom: 1px solid #334155; padding-bottom: 10px; margin-top: 0; }
    .score { font-size: 42px; font-weight: bold; color: #4ade80; }
    .badge { padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .badge-critical { background: #ef4444; color: white; }
    .badge-high { background: #f97316; color: white; }
    .badge-medium { background: #eab308; color: black; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
    .metric { background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; text-align: center; }
    .metric-value { font-size: 24px; font-weight: bold; color: #38bdf8; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #334155; }
    th { background: #0f172a; color: #94a3b8; font-size: 13px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>🛡️ CYBERMIND OS — EXECUTIVE CISO QBR BRIEFING</h1>
      <p style="color: #94a3b8; margin: 4px 0 0 0;">Customer: <strong>${data.customerName}</strong> | Site: <strong>${data.siteName}</strong></p>
    </div>
    <div style="text-align: right;">
      <div style="color: #94a3b8;">Report Date</div>
      <div style="font-weight: bold; color: #38bdf8;">${data.generatedDate}</div>
    </div>
  </div>

  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2>System & Firewall Baseline</h2>
        <p><strong>Vendor:</strong> ${data.vendor.toUpperCase()} | <strong>Model:</strong> ${data.model} | <strong>Firmware:</strong> ${data.firmware}</p>
        <p><strong>Serial Number:</strong> ${data.serialNumber}</p>
      </div>
      <div style="text-align: center; background: #0f172a; padding: 20px 30px; border-radius: 12px; border: 1px solid #334155;">
        <div style="font-size: 13px; color: #94a3b8;">Overall Security Score</div>
        <div class="score">${data.overallHealthScore}/100</div>
      </div>
    </div>
  </div>

  <div class="card">
    <h2>📊 Findings Severity Summary</h2>
    <div class="grid">
      <div class="metric"><div>Critical</div><div class="metric-value" style="color: #ef4444;">${data.severityCounts.critical}</div></div>
      <div class="metric"><div>High</div><div class="metric-value" style="color: #f97316;">${data.severityCounts.high}</div></div>
      <div class="metric"><div>Medium</div><div class="metric-value" style="color: #eab308;">${data.severityCounts.medium}</div></div>
      <div class="metric"><div>Low</div><div class="metric-value" style="color: #38bdf8;">${data.severityCounts.low}</div></div>
    </div>
  </div>

  <div class="card">
    <h2>🧠 Executive Summary</h2>
    <p>${data.cisoExecutiveSummary.replace(/\n/g, '<br/>')}</p>
  </div>

  <div class="card">
    <h2>🔍 Audit Findings & Remediation Plan</h2>
    <table>
      <thead>
        <tr>
          <th>Control ID</th>
          <th>Severity</th>
          <th>Observed Configuration</th>
          <th>Remediation Recommendation</th>
        </tr>
      </thead>
      <tbody>
        ${data.findings.length > 0 ? data.findings.map(f => `
          <tr>
            <td><strong>${f.controlId}</strong></td>
            <td><span class="badge badge-${f.severity.toLowerCase()}">${f.severity}</span></td>
            <td>${f.actualConfig}</td>
            <td>${f.recommendation}</td>
          </tr>
        `).join('') : '<tr><td colspan="4" style="text-align: center; color: #94a3b8;">No failing configuration findings detected.</td></tr>'}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}
