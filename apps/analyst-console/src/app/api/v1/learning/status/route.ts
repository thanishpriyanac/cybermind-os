export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadLearningStore, getLearningScheduleInfo } from '@/lib/learning-store';
import { getCtiRegistrySummary, CYBERMIND_CTI_REGISTRY } from '@/lib/cti-pipeline';
import { getRagStats } from '@/lib/rag-engine';

function getStorageMetrics() {
  const dataDir = path.join(process.cwd(), 'data');
  const learningStorePath = path.join(dataDir, 'learning_store.json');
  const modelDatasetPath = path.join(dataDir, 'model_training_dataset.jsonl');

  const getFileStats = (filePath: string, filename: string, desc: string) => {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const bytes = stats.size;
        const size = bytes > 1048576 ? `${(bytes / 1048576).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
        return {
          filename,
          path: `data/${filename}`,
          size,
          bytes,
          exists: true,
          description: desc,
        };
      }
    } catch { /* ignore */ }
    return {
      filename,
      path: `data/${filename}`,
      size: '0 KB',
      bytes: 0,
      exists: false,
      description: desc,
    };
  };

  const learningStore = getFileStats(learningStorePath, 'learning_store.json', 'Persistent JSON database storing crawled cybersecurity knowledge & metadata');
  const modelDataset = getFileStats(modelDatasetPath, 'model_training_dataset.jsonl', 'JSONL instruction-tuning prompt-completion pairs formatted for LLM model fine-tuning');

  const totalBytes = learningStore.bytes + modelDataset.bytes;
  const totalStorageUsed = totalBytes > 1048576 ? `${(totalBytes / 1048576).toFixed(2)} MB` : `${(totalBytes / 1024).toFixed(1)} KB`;

  return {
    isStoredOnServer: true,
    serverStoragePath: dataDir,
    totalStorageUsed,
    totalStorageBytes: totalBytes,
    files: {
      learningStore,
      modelDataset,
    },
  };
}

export async function GET() {
  try {
    const store = loadLearningStore();
    const scheduleInfo = getLearningScheduleInfo();
    const storageMetrics = getStorageMetrics();
    const ctiRegistryMetrics = getCtiRegistrySummary();

    return NextResponse.json({
      status: store.status,
      activeWindow: {
        schedule: scheduleInfo.schedule,
        interval: scheduleInfo.interval,
        isWithinWindow: scheduleInfo.isWithinWindow,
        isWeekend: scheduleInfo.isWeekend,
        activeLabel: scheduleInfo.activeLabel,
      },
      ctiPipeline: {
        architecture: ctiRegistryMetrics.pipelineArchitecture,
        stixVersion: ctiRegistryMetrics.stixVersion,
        totalRegistryFeeds: ctiRegistryMetrics.totalFeeds,
        p0AuthoritativeFeeds: ctiRegistryMetrics.p0Count,
        p1ResearchFeeds: ctiRegistryMetrics.p1Count,
        p2IntelligenceFeeds: ctiRegistryMetrics.p2Count,
        registryFeeds: CYBERMIND_CTI_REGISTRY,
      },
      ragEngine: getRagStats(),
      lastRunAt: store.lastRunAt,
      currentUrl: store.currentUrl,
      currentQuery: store.currentQuery,
      totalArticles: store.totalArticles,
      totalTrainingPairs: store.totalTrainingPairs ?? store.articles.length,
      sourcesCrawled: store.sourcesCrawled,
      liveLogs: store.liveLogs.slice(0, 25),
      articles: store.articles.slice(0, 30),
      serverStorage: storageMetrics,
      storage: storageMetrics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch learning status', details: error.message },
      { status: 500 }
    );
  }
}
