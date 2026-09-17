export type QbrReportStatus = 'DRAFT' | 'GENERATED' | 'IN_REVIEW' | 'FINALIZED';
export type OverallRiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface QbrFinding {
  controlId: string;
  category: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  status: 'FAIL' | 'WARNING' | 'PASS' | 'NON_COMPLIANT' | 'COMPLIANT' | 'MANUAL_REVIEW' | 'NOT_APPLICABLE';
  observation: string;
  risk: string;
  recommendation: string;
  evidence: string;
}

export interface RemediationItem {
  priority: 'immediate' | 'short_term' | 'long_term';
  finding: string;
  recommendation: string;
  targetDate: string;
  status: 'open' | 'in_progress' | 'complete';
}

export interface QbrReport {
  id: string;
  assessmentNumber: string;
  assessmentId?: string;
  customerName: string;
  siteName: string;
  vendor: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  assessmentDate: string;
  reportDate: string;
  preparedBy: string;
  overallScore: number;
  overallRisk: OverallRiskLevel;
  compliancePercentage: number;
  categoryScores: Record<string, number>;
  executiveSummary: string;
  findings: QbrFinding[];
  remediationPlan: RemediationItem[];
  format: string[];
  status: QbrReportStatus;
  createdAt: string;
  severityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

let inMemoryStore: QbrReport[] | null = null;

const INITIAL_QBR_REPORTS: QbrReport[] = [
  {
    id: 'qbr-001',
    assessmentNumber: 'FGT-2026-00001',
    customerName: 'Acme Corporation',
    siteName: 'Primary Enterprise Datacenter',
    vendor: 'fortinet',
    model: 'FortiGate-600F',
    serialNumber: 'FG600FTK23001892',
    firmwareVersion: 'v7.4.3',
    assessmentDate: '2026-09-01',
    reportDate: '2026-09-10',
    preparedBy: 'Senior SOC Consultant (admin@cybermind.local)',
    overallScore: 88,
    overallRisk: 'LOW',
    compliancePercentage: 88,
    categoryScores: {
      Administration: 90,
      'Firmware & System': 85,
      'Firewall Policies': 88,
      'Security Profiles': 92,
      VPN: 84,
    },
    executiveSummary: 'Acme Corp FortiGate 600F perimeter firewall assessment completed. Overall CIS compliance score is 88/100.',
    status: 'FINALIZED',
    format: ['DOCX', 'PDF'],
    createdAt: '2026-09-10T14:30:00Z',
    severityCounts: { critical: 0, high: 1, medium: 2, low: 2, info: 0 },
    findings: [
      {
        controlId: 'FH-FGT-A01',
        category: 'Administration',
        name: 'Admin MFA Enforcement',
        severity: 'HIGH',
        status: 'FAIL',
        observation: 'Two administrative accounts lack mandatory TOTP multi-factor authentication.',
        risk: 'High risk of credential theft resulting in administrative takeover.',
        recommendation: 'Enforce TOTP or RADIUS/SAML MFA across all FortiGate admin accounts.',
        evidence: 'config system admin: user "admin_backup" mfa disabled',
      },
    ],
    remediationPlan: [
      {
        priority: 'immediate',
        finding: 'Admin MFA Enforcement',
        recommendation: 'Enable SAML MFA via Okta/Azure AD for all perimeter admins.',
        targetDate: '2026-09-20',
        status: 'in_progress',
      },
    ],
  },
];

export const qbrStore = {
  loadStore(): QbrReport[] {
    if (inMemoryStore) return inMemoryStore;
    inMemoryStore = INITIAL_QBR_REPORTS;
    return inMemoryStore;
  },

  saveStore(data: QbrReport[]): void {
    inMemoryStore = data;
  },

  listReports(filters?: { status?: string; search?: string }): QbrReport[] {
    let reports = this.loadStore();
    if (filters?.status && filters.status !== 'ALL') {
      reports = reports.filter((r) => r.status.toUpperCase() === filters.status!.toUpperCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      reports = reports.filter((r) =>
        r.customerName.toLowerCase().includes(q) ||
        r.assessmentNumber.toLowerCase().includes(q) ||
        r.vendor.toLowerCase().includes(q) ||
        r.model.toLowerCase().includes(q)
      );
    }
    return reports;
  },

  getReport(id: string): QbrReport | undefined {
    return this.loadStore().find((r) => r.id === id || r.assessmentNumber === id);
  },

  createReport(data: Partial<QbrReport>): QbrReport {
    const store = this.loadStore();
    const count = store.length + 1;
    const assessmentNumber = data.assessmentNumber || `FGT-2026-${count.toString().padStart(5, '0')}`;

    const newReport: QbrReport = {
      id: `qbr-${Date.now()}`,
      assessmentNumber,
      assessmentId: data.assessmentId || '',
      customerName: data.customerName || 'Enterprise Client',
      siteName: data.siteName || 'HQ Node',
      vendor: data.vendor || 'fortinet',
      model: data.model || 'FortiGate',
      serialNumber: data.serialNumber || 'SN-NOT-AVAILABLE',
      firmwareVersion: data.firmwareVersion || 'v7.4.x',
      assessmentDate: data.assessmentDate || new Date().toISOString().split('T')[0],
      reportDate: data.reportDate || new Date().toISOString().split('T')[0],
      preparedBy: data.preparedBy || 'CyberMind Platform',
      overallScore: data.overallScore ?? 85,
      overallRisk: data.overallRisk || (data.overallScore && data.overallScore < 70 ? 'HIGH' : 'LOW'),
      compliancePercentage: data.compliancePercentage ?? data.overallScore ?? 85,
      categoryScores: data.categoryScores || { Administration: 85, 'Firewall Policies': 85, 'Security Profiles': 85 },
      executiveSummary: data.executiveSummary || `QBR Security Report generated for ${data.customerName || 'Enterprise Client'}.`,
      findings: data.findings || [],
      remediationPlan: data.remediationPlan || [],
      format: data.format || ['DOCX', 'PDF'],
      status: data.status || 'GENERATED',
      createdAt: new Date().toISOString(),
      severityCounts: data.severityCounts || { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    };

    store.unshift(newReport);
    this.saveStore(store);
    return newReport;
  },

  updateReport(id: string, updates: Partial<QbrReport>): QbrReport | undefined {
    const store = this.loadStore();
    const idx = store.findIndex((r) => r.id === id || r.assessmentNumber === id);
    if (idx === -1) return undefined;
    store[idx] = { ...store[idx], ...updates };
    this.saveStore(store);
    return store[idx];
  },
};
