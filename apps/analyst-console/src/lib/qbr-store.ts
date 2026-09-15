import fs from 'fs';
import path from 'path';

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
  overallScore: number; // Compliance % (0-100)
  overallRisk: OverallRiskLevel;
  compliancePercentage: number;
  categoryScores: Record<string, number>;
  executiveSummary: string;
  findings: QbrFinding[];
  remediationPlan: RemediationItem[];
  format: string[]; // e.g. ['DOCX', 'PDF']
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

function getDataFilePath(): string {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'data', 'qbr_store.json'),
    path.join(cwd, '..', 'data', 'qbr_store.json'),
    path.join(cwd, '..', '..', 'data', 'qbr_store.json'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.dirname(c))) return c;
  }
  const fallbackDir = path.join(cwd, 'data');
  try {
    fs.mkdirSync(fallbackDir, { recursive: true });
  } catch { /* skip */ }
  return path.join(fallbackDir, 'qbr_store.json');
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
    executiveSummary: 'Acme Corp FortiGate 600F perimeter firewall assessment completed. Overall CIS compliance score is 88/100 (LOW Risk). 2 minor configuration items requiring admin MFA enforcement and SSL VPN split-tunneling adjustment.',
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
  {
    id: 'qbr-002',
    assessmentNumber: 'FGT-2026-00002',
    customerName: 'Globex Enterprise Inc',
    siteName: 'Cloud Gateway West',
    vendor: 'paloalto',
    model: 'PA-3260',
    serialNumber: 'PA01992837112',
    firmwareVersion: 'PAN-OS 11.1',
    assessmentDate: '2026-09-05',
    reportDate: '2026-09-12',
    preparedBy: 'Security Architect',
    overallScore: 68,
    overallRisk: 'HIGH',
    compliancePercentage: 68,
    categoryScores: {
      Administration: 70,
      'Firmware & System': 65,
      'Firewall Policies': 60,
      'Security Profiles': 75,
      VPN: 70,
    },
    executiveSummary: 'Globex Inc Palo Alto PA-3260 perimeter review identified 3 HIGH priority policy vulnerabilities including overly permissive inbound rules and disabled WildFire inspection.',
    status: 'IN_REVIEW',
    format: ['DOCX'],
    createdAt: '2026-09-12T11:20:00Z',
    severityCounts: { critical: 1, high: 3, medium: 4, low: 2, info: 0 },
    findings: [
      {
        controlId: 'FH-PA-P01',
        category: 'Firewall Policies',
        name: 'Overly Permissive Inbound Security Rule',
        severity: 'CRITICAL',
        status: 'FAIL',
        observation: 'Rule "Allow-DMZ-Any" allows any protocol from untrusted WAN zone to internal app servers.',
        risk: 'Critical risk of perimeter bypass and unauthenticated RCE.',
        recommendation: 'Restrict rule to specific TCP ports 443/8443 and enable App-ID.',
        evidence: 'rulebase security rules Allow-DMZ-Any service any source any',
      },
    ],
    remediationPlan: [
      {
        priority: 'immediate',
        finding: 'Overly Permissive Inbound Security Rule',
        recommendation: 'Restrict rule to explicit HTTPS service objects.',
        targetDate: '2026-09-18',
        status: 'open',
      },
    ],
  },
  {
    id: 'qbr-003',
    assessmentNumber: 'FGT-2026-00003',
    customerName: 'Initech Financial',
    siteName: 'HQ Branch Office',
    vendor: 'cisco',
    model: 'Firepower 2130',
    serialNumber: 'FTD99102834',
    firmwareVersion: 'FTD 7.2.5',
    assessmentDate: '2026-09-08',
    reportDate: '2026-09-14',
    preparedBy: 'CyberAI Automated Engine',
    overallScore: 94,
    overallRisk: 'LOW',
    compliancePercentage: 94,
    categoryScores: {
      Administration: 95,
      'Firmware & System': 92,
      'Firewall Policies': 96,
      'Security Profiles': 94,
      VPN: 93,
    },
    executiveSummary: 'Initech Financial Cisco Firepower audit completed with 94/100 score. All critical controls compliant.',
    status: 'GENERATED',
    format: ['DOCX', 'PDF'],
    createdAt: '2026-09-14T09:15:00Z',
    severityCounts: { critical: 0, high: 0, medium: 2, low: 1, info: 0 },
    findings: [],
    remediationPlan: [],
  },
  {
    id: 'qbr-004',
    assessmentNumber: 'FGT-2026-00004',
    customerName: 'Stark Security Systems',
    siteName: 'R&D Datacenter',
    vendor: 'fortinet',
    model: 'FortiGate-100F',
    serialNumber: 'FG100FTK230911',
    firmwareVersion: 'v7.4.2',
    assessmentDate: '2026-09-11',
    reportDate: '2026-09-15',
    preparedBy: 'Analyst (admin@cybermind.local)',
    overallScore: 78,
    overallRisk: 'MEDIUM',
    compliancePercentage: 78,
    categoryScores: {
      Administration: 80,
      'Firmware & System': 75,
      'Firewall Policies': 78,
      'Security Profiles': 80,
      VPN: 76,
    },
    executiveSummary: 'Draft assessment report for Stark Security Systems FortiGate 100F appliance.',
    status: 'DRAFT',
    format: ['DOCX'],
    createdAt: '2026-09-15T16:00:00Z',
    severityCounts: { critical: 0, high: 2, medium: 3, low: 1, info: 0 },
    findings: [],
    remediationPlan: [],
  },
];

export const qbrStore = {
  loadStore(): QbrReport[] {
    if (inMemoryStore) return inMemoryStore;
    const filePath = getDataFilePath();
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        inMemoryStore = Array.isArray(parsed) ? parsed : INITIAL_QBR_REPORTS;
        return inMemoryStore;
      }
    } catch (err) {
      console.error('Failed to read qbr_store.json:', err);
    }
    inMemoryStore = INITIAL_QBR_REPORTS;
    this.saveStore(inMemoryStore);
    return inMemoryStore;
  },

  saveStore(data: QbrReport[]): void {
    inMemoryStore = data;
    const filePath = getDataFilePath();
    try {
      const tmp = `${filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmp, filePath);
    } catch (err) {
      console.error('Failed to write qbr_store.json:', err);
    }
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
