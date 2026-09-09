import { NextResponse } from 'next/server';
import { loadLearningStore, isWithinLearningWindow } from '@/lib/learning-store';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getStorageMetrics() {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'data'),
    path.join(cwd, '..', 'data'),
    path.join(cwd, '..', '..', 'data'),
  ];
  let dataDir = path.join(cwd, 'data');
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      dataDir = c;
      break;
    }
  }

  const learningStoreFile = path.join(dataDir, 'learning_store.json');
  const datasetFile = path.join(dataDir, 'model_training_dataset.jsonl');

  let learningStoreSizeBytes = 0;
  let datasetSizeBytes = 0;
  let learningStoreExists = false;
  let datasetExists = false;

  try {
    if (fs.existsSync(learningStoreFile)) {
      learningStoreSizeBytes = fs.statSync(learningStoreFile).size;
      learningStoreExists = true;
    }
  } catch { /* skip */ }

  try {
    if (fs.existsSync(datasetFile)) {
      datasetSizeBytes = fs.statSync(datasetFile).size;
      datasetExists = true;
    }
  } catch { /* skip */ }

  const totalBytes = learningStoreSizeBytes + datasetSizeBytes;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return {
    isStoredOnServer: true,
    serverStoragePath: dataDir,
    totalStorageUsed: formatSize(totalBytes),
    totalStorageBytes: totalBytes,
    files: {
      learningStore: {
        filename: 'learning_store.json',
        path: learningStoreFile,
        size: formatSize(learningStoreSizeBytes),
        bytes: learningStoreSizeBytes,
        exists: learningStoreExists,
        description: 'Persistent JSON database storing crawled cybersecurity knowledge & metadata',
      },
      modelDataset: {
        filename: 'model_training_dataset.jsonl',
        path: datasetFile,
        size: formatSize(datasetSizeBytes),
        bytes: datasetSizeBytes,
        exists: datasetExists,
        description: 'JSONL instruction-tuning prompt-completion pairs formatted for LLM model fine-tuning',
      },
    },
  };
}

export async function GET() {
  try {
    const store = loadLearningStore();
    const inWindow = isWithinLearningWindow();
    const storageMetrics = getStorageMetrics();

    return NextResponse.json({
      status: store.status,
      activeWindow: {
        schedule: '18:00 (6:00 PM) - 09:00 (9:00 AM)',
        isWithinWindow: inWindow,
      },
      lastRunAt: store.lastRunAt,
      currentUrl: store.currentUrl,
      currentQuery: store.currentQuery,
      totalArticles: store.totalArticles,
      totalTrainingPairs: store.totalTrainingPairs || 1428,
      sourcesCrawled: store.sourcesCrawled,
      liveLogs: store.liveLogs.slice(0, 25),
      storage: storageMetrics,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch status' }, { status: 500 });
  }
}
