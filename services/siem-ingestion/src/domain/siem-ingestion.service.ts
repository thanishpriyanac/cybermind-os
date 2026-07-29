import { Injectable, Logger } from '@nestjs/common';
import { BulkWriter } from '../infrastructure/opensearch/bulk-writer.service';
import { EnrichedEvent } from '../../../../packages/schemas/src/normalization/enriched-event';

@Injectable()
export class SiemIngestionService {
  private readonly logger = new Logger(SiemIngestionService.name);

  constructor(private readonly bulkWriter: BulkWriter) {}

  async handleEnrichedEvent(event: EnrichedEvent): Promise<void> {
    if (!event?.canonicalEvent?.tenantId) {
      this.logger.warn('Rejected event missing tenant_id');
      return;
    }

    if (!event?.canonicalEvent?.eventId) {
      this.logger.warn('Rejected event missing event_id');
      return;
    }

    const receivedAt = new Date();
    this.bulkWriter.add(event, receivedAt);
  }
}
