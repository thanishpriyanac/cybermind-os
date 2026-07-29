import { Injectable, Logger } from '@nestjs/common';
import { EnrichedEvent } from '../../../../../packages/schemas/src/normalization/enriched-event';
import { OpenSearchIndexer } from '../opensearch/opensearch-indexer.service';
import { CybermindKafkaPublisher } from '../../../../../packages/sdk/event-client/src/kafka-publisher';

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 500;
const DLQ_TOPIC = 'siem.dlq';

interface RetryItem {
  event: EnrichedEvent;
  receivedAt: Date;
  attempt: number;
}

@Injectable()
export class RetryQueue {
  private readonly logger = new Logger(RetryQueue.name);
  private readonly queue: RetryItem[] = [];
  private processing = false;

  constructor(
    private readonly indexer: OpenSearchIndexer,
    private readonly publisher: CybermindKafkaPublisher,
  ) {}

  async enqueue(event: EnrichedEvent, receivedAt: Date, attempt = 1) {
    this.queue.push({ event, receivedAt, attempt });
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      const delay = BASE_DELAY_MS * Math.pow(2, item.attempt - 1); // exponential backoff
      await this.sleep(delay);

      try {
        await this.indexer.indexOne(item.event, item.receivedAt);
        this.logger.log(`Retry success for event ${item.event.canonicalEvent.eventId} (attempt ${item.attempt})`);
      } catch (error: any) {
        if (item.attempt < MAX_ATTEMPTS) {
          this.logger.warn(
            `Retry attempt ${item.attempt} failed for ${item.event.canonicalEvent.eventId}: ${error.message}`
          );
          await this.enqueue(item.event, item.receivedAt, item.attempt + 1);
        } else {
          this.logger.error(
            `Exhausted retries for ${item.event.canonicalEvent.eventId} — routing to DLQ`
          );
          await this.publisher
            .publish(DLQ_TOPIC, 'SiemIndexingFailed', item.event, {
              tenantId: item.event.canonicalEvent.tenantId,
              correlationId: item.event.canonicalEvent.correlationId,
            })
            .catch(e => this.logger.error(`DLQ publish failed: ${e.message}`));
        }
      }
    }

    this.processing = false;
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
