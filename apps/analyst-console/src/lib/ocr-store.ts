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

// In-memory store — no filesystem on edge runtime
let inMemoryStore: OcrStore = {
  totalScans: 0,
  totalIngested: 0,
  lastScanAt: null,
  records: [],
};

export function loadOcrStore(): OcrStore {
  return inMemoryStore;
}

export function saveOcrStore(store: OcrStore): void {
  inMemoryStore = store;
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
  const record = store.records.find((r) => r.id === recordId);
  if (record) {
    record.ingestedToLearning = true;
    record.learningArticleId = articleId;
    store.totalIngested = store.records.filter((r) => r.ingestedToLearning).length;
    saveOcrStore(store);
    return true;
  }
  return false;
}

export function getOcrRecords(limit = 50): OcrRecord[] {
  return loadOcrStore().records.slice(0, limit);
}
