import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'ip_store.json');

export interface IpReport {
  reportedAt: string;
  comment: string;
  categories: number[];
  categoryNames: string[];
}

export interface IpInvestigation {
  id: string; // uuid
  ip: string;
  ipVersion: 4 | 6;
  investigatedAt: string; // ISO
  abuseScore: number; // 0-100
  totalReports: number;
  lastReported: string | null;
  isWhitelisted: boolean;
  countryCode: string;
  countryName: string;
  isp: string;
  domain: string;
  usageType: string;
  threatClassification: 'malicious' | 'suspicious' | 'low_risk' | 'clean';
  reports: IpReport[];
  rawResponse: any;
}

export interface BlacklistEntry {
  ipAddress: string;
  abuseConfidenceScore: number;
  countryCode: string;
  usageType: string;
  isp: string;
  domain: string;
  lastReportedAt: string;
  numDistinctUsers: number;
  totalReportsNum: number;
}

export interface IpStoreData {
  investigations: IpInvestigation[];
  lastBlacklistFetch: string | null;
  blacklist: BlacklistEntry[];
}

let inMemoryStore: IpStoreData | null = null;

function loadStore(): IpStoreData {
  if (inMemoryStore) return inMemoryStore;

  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      inMemoryStore = JSON.parse(raw);
      return inMemoryStore!;
    }
  } catch (err) {
    console.error('Failed to read IP store file, using defaults', err);
  }

  inMemoryStore = {
    investigations: [],
    lastBlacklistFetch: null,
    blacklist: [],
  };
  saveStore(inMemoryStore);
  return inMemoryStore;
}

function saveStore(store: IpStoreData) {
  inMemoryStore = store;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write IP store file', err);
  }
}

export const ipStore = {
  loadStore,
  saveStore,
  addInvestigation(inv: IpInvestigation) {
    const store = loadStore();
    // Keep most recent first, optional unique IP constraint or just append
    store.investigations.unshift(inv);
    saveStore(store);
  },
  getInvestigation(ip: string): IpInvestigation | undefined {
    const store = loadStore();
    return store.investigations.find((inv) => inv.ip === ip);
  },
  getHistory(limit: number = 50): IpInvestigation[] {
    const store = loadStore();
    return store.investigations.slice(0, limit);
  },
  updateBlacklist(data: BlacklistEntry[]) {
    const store = loadStore();
    store.blacklist = data;
    store.lastBlacklistFetch = new Date().toISOString();
    saveStore(store);
  },
  getBlacklist(filters?: { limit?: number; minConfidence?: number; countryCode?: string }): BlacklistEntry[] {
    const store = loadStore();
    let result = store.blacklist;
    
    if (filters?.minConfidence) {
      result = result.filter((b) => b.abuseConfidenceScore >= (filters.minConfidence || 0));
    }
    if (filters?.countryCode) {
      result = result.filter((b) => b.countryCode === filters.countryCode);
    }
    
    if (filters?.limit) {
      result = result.slice(0, filters.limit);
    }
    return result;
  },
  getStatus() {
    const store = loadStore();
    return {
      investigationsCount: store.investigations.length,
      lastBlacklistFetch: store.lastBlacklistFetch,
    };
  }
};
