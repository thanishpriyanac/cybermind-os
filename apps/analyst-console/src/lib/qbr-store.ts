import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface QbrReport {
  id: string;
  assessmentId: string;
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
  categoryScores: Record<string, number>;
  executiveSummary: string;
  findings: QbrFinding[];
  remediationPlan: RemediationItem[];
  status: 'draft' | 'final';
  createdAt: string;
}

export interface QbrFinding {
  controlId: string;
  category: string;
  name: string;
  severity: string;
  status: string;
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

const dataDir = path.join(process.cwd(), 'data');
const storePath = path.join(dataDir, 'qbr_store.json');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export const qbrStore = {
  loadStore(): QbrReport[] {
    ensureDataDir();
    if (fs.existsSync(storePath)) {
      try {
        const data = fs.readFileSync(storePath, 'utf8');
        return JSON.parse(data);
      } catch (err) {
        console.error('Failed to parse qbr store', err);
        return [];
      }
    }
    return [];
  },

  saveStore(data: QbrReport[]) {
    ensureDataDir();
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
  },

  listReports(): QbrReport[] {
    return this.loadStore();
  },

  getReport(id: string): QbrReport | undefined {
    return this.loadStore().find(r => r.id === id);
  },

  createReport(data: Omit<QbrReport, 'id' | 'createdAt'>): QbrReport {
    const store = this.loadStore();
    const newReport: QbrReport = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    store.push(newReport);
    this.saveStore(store);
    return newReport;
  },

  updateReport(id: string, updates: Partial<QbrReport>): QbrReport | undefined {
    const store = this.loadStore();
    const idx = store.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    
    store[idx] = { ...store[idx], ...updates };
    this.saveStore(store);
    return store[idx];
  }
};
