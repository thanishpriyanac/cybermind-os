import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';
import { EnrichedEvent } from '../../../../../packages/schemas/src/normalization/enriched-event';

const WRITE_ALIAS = 'cybermind-events-write';
const PIPELINE_VERSION = '1.0.0';
const SCHEMA_VERSION = '1.0.0';

@Injectable()
export class OpenSearchIndexer {
  private readonly logger = new Logger(OpenSearchIndexer.name);

  constructor(private readonly client: Client) {}

  /**
   * Map an EnrichedEvent to the CYBERMIND OpenSearch document format.
   * Uses event_id as the document _id to guarantee idempotency.
   */
  toDocument(event: EnrichedEvent, receivedAt: Date): Record<string, any> {
    const now = new Date().toISOString();
    return {
      event_id:             event.canonicalEvent.eventId,
      tenant_id:            event.canonicalEvent.tenantId,
      event_time:           event.canonicalEvent.eventTime,
      ingested_at:          receivedAt.toISOString(),
      indexed_at:           now,
      ingestion_latency_ms: Date.now() - receivedAt.getTime(),
      pipeline_version:     PIPELINE_VERSION,
      schema_version:       SCHEMA_VERSION,
      source:               event.canonicalEvent.source,
      category:             event.canonicalEvent.category,
      normalized_severity:  event.normalizedSeverity,
      confidence_score:     event.confidenceScore,
      correlation_id:       event.canonicalEvent.correlationId,

      // Asset enrichment context
      asset: event.asset ?? null,

      // MITRE ATT&CK tags
      mitre: event.mitre ?? [],

      // Threat Intel hits
      threat_intel: event.threatIntel ?? [],

      // Dynamic vendor fields (stored as flattened)
      normalized_data: event.canonicalEvent.normalizedData ?? {},

      // Audit trail (stored but not indexed)
      enrichment_metadata: event.enrichmentMetadata,

      // Raw forensic payload (binary, not indexed)
      raw_payload: event.canonicalEvent.rawPayload
        ? Buffer.from(event.canonicalEvent.rawPayload).toString('base64')
        : null,
    };
  }

  /**
   * Perform a single upsert. For bulk operations, use BulkWriter.
   */
  async indexOne(event: EnrichedEvent, receivedAt: Date): Promise<void> {
    if (!event.canonicalEvent.tenantId) {
      throw new Error('tenant_id is required for indexing');
    }

    const doc = this.toDocument(event, receivedAt);
    await this.client.index({
      index: WRITE_ALIAS,
      id: event.canonicalEvent.eventId,
      body: doc,
      op_type: 'index', // "index" performs upsert-style — overwrites on same _id
    });
  }
}
