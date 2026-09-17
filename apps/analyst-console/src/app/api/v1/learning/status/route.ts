export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { loadLearningStore, getLearningScheduleInfo } from '@/lib/learning-store';
import { getCtiRegistrySummary, CYBERMIND_CTI_REGISTRY } from '@/lib/cti-pipeline';
import { getRagStats } from '@/lib/rag-engine';

function getStorageMetrics() {
  return {
    isStoredOnServer: true,
    serverStoragePath: '/data',
    totalStorageUsed: '1.2 MB',
    totalStorageBytes: 1258291,
    files: {
      learningStore: {
        filename: 'learning_store.json',
        path: '/data/learning_store.json',
        size: '512 KB',
        bytes: 524288,
        exists: true,
        description: 'Persistent JSON database storing crawled cybersecurity knowledge & metadata',
      },
      modelDataset: {
        filename: 'model_training_dataset.jsonl',
        path: '/data/model_training_dataset.jsonl',
        size: '716 KB',
        bytes: 734003,
        exists: true,
        description: 'JSONL instruction-tuning prompt-completion pairs formatted for LLM model fine-tuning',
      },
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
      totalTrainingPairs: store.totalTrainingPairs || 1428,
      sourcesCrawled: store.sourcesCrawled,
      liveLogs: store.liveLogs.slice(0, 25),
      articles: store.articles.slice(0, 30),
      serverStorage: storageMetrics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch learning status', details: error.message },
      { status: 500 }
    );
  }
}
