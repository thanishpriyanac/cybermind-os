import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';
import { EnrichedEvent } from '../../../../../packages/schemas/src/normalization/enriched-event';
import { OpenSearchIndexer } from './opensearch-indexer.service';
import { RetryQueue } from '../retry/retry-queue.service';

const WRITE_ALIAS = 'cybermind-events-write';

export interface BulkWriterConfig {
  maxBatchSize: number;          // default: 500
  flushIntervalMs: number;       // default: 5000
  maxConcurrentBulkRequests: number; // default: 3
  retryBatchSize: number;        // default: 100
}

interface BufferedEvent {
  event: EnrichedEvent;
  receivedAt: Date;
}

@Injectable()
export class BulkWriter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BulkWriter.name);
  private buffer: BufferedEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private activeRequests = 0;

  private readonly config: BulkWriterConfig = {
    maxBatchSize: parseInt(process.env.SIEM_BULK_BATCH_SIZE ?? '500', 10),
    flushIntervalMs: parseInt(process.env.SIEM_BULK_FLUSH_INTERVAL_MS ?? '5000', 10),
    maxConcurrentBulkRequests: parseInt(process.env.SIEM_BULK_MAX_CONCURRENT ?? '3', 10),
    retryBatchSize: parseInt(process.env.SIEM_BULK_RETRY_BATCH_SIZE ?? '100', 10),
  };

  constructor(
    private readonly client: Client,
    private readonly indexer: OpenSearchIndexer,
    private readonly retryQueue: RetryQueue,
  ) {}

  onModuleInit() {
    this.flushTimer = setInterval(() => this.flush('timer'), this.config.flushIntervalMs);
    this.logger.log(
      `BulkWriter started — batch: ${this.config.maxBatchSize}, interval: ${this.config.flushIntervalMs}ms`
    );
  }

  async onModuleDestroy() {
    clearInterval(this.flushTimer);
    await this.flush('shutdown');
  }

  add(event: EnrichedEvent, receivedAt: Date) {
    this.buffer.push({ event, receivedAt });
    if (this.buffer.length >= this.config.maxBatchSize) {
      this.flush('size');
    }
  }

  private async flush(reason: string) {
    if (this.buffer.length === 0) return;
    if (this.activeRequests >= this.config.maxConcurrentBulkRequests) {
      this.logger.warn(`Max concurrent bulk requests reached — skipping flush (${reason})`);
      return;
    }

    const batch = this.buffer.splice(0, this.config.maxBatchSize);
    this.activeRequests++;

    try {
      const body = batch.flatMap(({ event, receivedAt }) => [
        { index: { _index: WRITE_ALIAS, _id: event.canonicalEvent.eventId } },
        this.indexer.toDocument(event, receivedAt),
      ]);

      const { body: result } = await this.client.bulk({ body, refresh: false });

      if (result.errors) {
        const failed = (result.items as any[])
          .filter(item => item.index?.error)
          .map((item, idx) => batch[idx]);

        this.logger.warn(`Bulk partial failure: ${failed.length} events failed`);
        for (const item of failed) {
          await this.retryQueue.enqueue(item.event, item.receivedAt);
        }
      }

      this.logger.log(`Bulk flushed ${batch.length} events (reason: ${reason})`);
    } catch (error: any) {
      this.logger.error(`Bulk flush error: ${error.message}`);
      for (const item of batch) {
        await this.retryQueue.enqueue(item.event, item.receivedAt);
      }
    } finally {
      this.activeRequests--;
    }
  }
}
