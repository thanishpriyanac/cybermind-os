import fs from 'fs';
import path from 'path';
import { OcrResult } from './ocr-engine';

export interface OcrRecord {
  id: string;
  filename: string;
  scannedAt: string;
  imageType: string;
  ocrResult: OcrResult;
  ingestedToLearning: boolean;
  learningArticleId?: string;
}

export interface OcrStore {
  totalScans: number;
  totalIngested: number;
  lastScanAt: string | null;
  records: OcrRecord[];
}

let inMemoryStore: OcrStore | null = null;

function getDataFilePath(): string {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'data', 'ocr_store.json'),
    path.join(cwd, '..', 'data', 'ocr_store.json'),
    path.join(cwd, '..', '..', 'data', 'ocr_store.json'),
    path.join(cwd, '..', '..', '..', 'data', 'ocr_store.json'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.dirname(c))) return c;
  }
  const fallbackDir = path.join(cwd, 'data');
  try {
    fs.mkdirSync(fallbackDir, { recursive: true });
  } catch {}
  return path.join(fallbackDir, 'ocr_store.json');
}

export function loadOcrStore(): OcrStore {
  if (inMemoryStore) return inMemoryStore;

  const filePath = getDataFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      inMemoryStore = JSON.parse(data);
      return inMemoryStore!;
    } catch (e) {
      console.error('[OCR-STORE] Error reading store file:', e);
    }
  }

  inMemoryStore = {
    totalScans: 0,
    totalIngested: 0,
    lastScanAt: null,
    records: []
  };

  saveOcrStore(inMemoryStore);
  return inMemoryStore;
}

export function saveOcrStore(store: OcrStore): void {
  inMemoryStore = store;
  const filePath = getDataFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('[OCR-STORE] Error saving store file:', e);
  }
}

export function addOcrRecord(record: OcrRecord): OcrRecord {
  const store = loadOcrStore();
  store.records.unshift(record);
  if (store.records.length > 200) {
    store.records = store.records.slice(0, 200);
  }
  store.totalScans = store.records.length;
  store.lastScanAt = record.scannedAt;
  if (record.ingestedToLearning) {
    store.totalIngested += 1;
  }
  saveOcrStore(store);
  return record;
}

export function markOcrRecordIngested(recordId: string, articleId: string): boolean {
  const store = loadOcrStore();
  const record = store.records.find(r => r.id === recordId);
  if (record) {
    record.ingestedToLearning = true;
    record.learningArticleId = articleId;
    store.totalIngested = store.records.filter(r => r.ingestedToLearning).length;
    saveOcrStore(store);
    return true;
  }
  return false;
}

export function getOcrRecords(limit = 50): OcrRecord[] {
  const store = loadOcrStore();
  return store.records.slice(0, limit);
}
