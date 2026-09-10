import fs from 'fs';
import path from 'path';
import { getVendorControls } from './vendors';

export type Vendor = 'fortinet' | 'paloalto' | 'sophos' | 'cisco' | 'checkpoint';
export type CheckStatus = 'PASS' | 'FAIL' | 'WARNING' | 'NOT_APPLICABLE' | 'MANUAL_REVIEW';
export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export interface CheckControl {
  id: string;
  category: string;
  name: string;
  description: string;
  expectedConfig: string;
  severity: FindingSeverity;
  reference: string;
}

export interface FindingRecord {
  controlId: string;
  status: CheckStatus;
  actualConfig: string;
  evidence: string;
  notes: string;
}

export interface FirewallAssessment {
  id: string;
  vendor: Vendor;
  customerName: string;
  siteName: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  assessmentDate: string;
  assessedBy: string;
  findings: FindingRecord[];
  overallScore: number;
  categoryScores: Record<string, number>;
  status: 'draft' | 'complete';
  createdAt: string;
  updatedAt: string;
}

export interface FirewallStore {
  assessments: FirewallAssessment[];
}

import { getDataFilePath, writeJsonAtomic } from './atomic-store';

function getStoreFilePath(): string {
  return getDataFilePath('firewall_store.json');
}

let inMemoryStore: FirewallStore | null = null;

function loadStore(): FirewallStore {
  if (inMemoryStore) return inMemoryStore;

  try {
    const file = getStoreFilePath();
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      inMemoryStore = JSON.parse(raw);
      return inMemoryStore!;
    }
  } catch (err) {
    console.error('Failed to read firewall store file, using defaults', err);
  }

  inMemoryStore = { assessments: [] };
  saveStore(inMemoryStore);
  return inMemoryStore;
}

function saveStore(store: FirewallStore) {
  inMemoryStore = store;
  try {
    const file = getStoreFilePath();
    writeJsonAtomic(file, store);
  } catch (err) {
    console.error('Failed to write firewall store file', err);
  }
}

export const firewallStore = {
  loadStore,
  saveStore,
  
  listAssessments(): FirewallAssessment[] {
    const store = loadStore();
    return store.assessments;
  },

  getAssessment(id: string): FirewallAssessment | null {
    const store = loadStore();
    return store.assessments.find((a) => a.id === id) || null;
  },

  createAssessment(data: Partial<FirewallAssessment>): FirewallAssessment {
    const store = loadStore();
    const id = `fa-${Date.now()}`;
    const now = new Date().toISOString();
    
    // Initialize findings with MANUAL_REVIEW
    const controls = data.vendor ? getVendorControls(data.vendor as Vendor) : [];
    const findings: FindingRecord[] = controls.map(c => ({
      controlId: c.id,
      status: 'MANUAL_REVIEW',
      actualConfig: '',
      evidence: '',
      notes: ''
    }));

    const newAssessment: FirewallAssessment = {
      id,
      vendor: data.vendor as Vendor,
      customerName: data.customerName || '',
      siteName: data.siteName || '',
      model: data.model || '',
      serialNumber: data.serialNumber || '',
      firmwareVersion: data.firmwareVersion || '',
      assessmentDate: data.assessmentDate || now,
      assessedBy: data.assessedBy || '',
      findings,
      overallScore: 0,
      categoryScores: {},
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    store.assessments.unshift(newAssessment);
    saveStore(store);
    return newAssessment;
  },

  updateAssessment(id: string, updates: Partial<FirewallAssessment>): FirewallAssessment | null {
    const store = loadStore();
    const index = store.assessments.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const current = store.assessments[index];
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    
    // Calculate scores if findings are updated
    if (updates.findings) {
      const controls = getVendorControls(updated.vendor);
      const scores = this.calculateScores(updates.findings, controls);
      updated.overallScore = scores.overall;
      updated.categoryScores = scores.byCategory;
    }

    store.assessments[index] = updated;
    saveStore(store);
    return updated;
  },

  deleteAssessment(id: string): void {
    const store = loadStore();
    store.assessments = store.assessments.filter((a) => a.id !== id);
    saveStore(store);
  },

  calculateScores(findings: FindingRecord[], controls: CheckControl[]): { overall: number, byCategory: Record<string, number> } {
    const SEVERITY_WEIGHTS = {
      CRITICAL: 10,
      HIGH: 7,
      MEDIUM: 4,
      LOW: 2,
      INFORMATIONAL: 1
    };
    
    const categoryStats: Record<string, { earned: number, possible: number }> = {};
    
    findings.forEach(f => {
      const control = controls.find(c => c.id === f.controlId);
      if (!control) return;
      
      const cat = control.category;
      if (!categoryStats[cat]) {
        categoryStats[cat] = { earned: 0, possible: 0 };
      }
      
      const weight = SEVERITY_WEIGHTS[control.severity];
      let earnedWeight = 0;
      
      if (f.status === 'PASS') {
        earnedWeight = weight;
      } else if (f.status === 'WARNING') {
        earnedWeight = weight / 2;
      }
      // FAIL, NOT_APPLICABLE, MANUAL_REVIEW earn 0
      
      // If N/A, we don't add to possible score
      if (f.status !== 'NOT_APPLICABLE') {
        categoryStats[cat].possible += weight;
        categoryStats[cat].earned += earnedWeight;
      }
    });
    
    const byCategory: Record<string, number> = {};
    let totalEarned = 0;
    let totalPossible = 0;
    
    for (const [cat, stats] of Object.entries(categoryStats)) {
      if (stats.possible > 0) {
        byCategory[cat] = Math.round((stats.earned / stats.possible) * 100);
        totalEarned += stats.earned;
        totalPossible += stats.possible;
      } else {
        byCategory[cat] = 100; // default if all N/A
      }
    }
    
    const overall = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;
    
    return { overall, byCategory };
  }
};
