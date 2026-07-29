import { Injectable } from '@nestjs/common';
import { CanonicalEvent } from '../../../../../packages/schemas/src/connector/canonical-event';
import { EnrichedEvent } from '../../../../../packages/schemas/src/normalization/enriched-event';
import { EnrichmentProcessor } from '../processors/processor.interface';
import { CybermindKafkaPublisher } from '../../../../../packages/sdk/event-client/src/kafka-publisher';

@Injectable()
export class NormalizationEngine {
  private processors: EnrichmentProcessor[] = [];

  constructor(private readonly eventPublisher: CybermindKafkaPublisher) {}

  registerProcessors(processors: EnrichmentProcessor[]) {
    this.processors = processors;
  }

  async processEvent(canonical: CanonicalEvent): Promise<EnrichedEvent> {
    // 1. Initialize EnrichedEvent wrapper
    let currentEvent: EnrichedEvent = {
      canonicalEvent: canonical,
      normalizedSeverity: 'INFORMATIONAL', // Will be overwritten
      confidenceScore: 50, // Base score
      enrichmentMetadata: [],
    };

    // 2. Execute Processor Pipeline
    for (const processor of this.processors) {
      try {
        const result = await processor.process(currentEvent);
        currentEvent = result.event;
        currentEvent.enrichmentMetadata.push(result.metadata);
      } catch (error) {
        // Failures must not stop the pipeline
        currentEvent.enrichmentMetadata.push({
          stage: processor.name,
          status: 'FAILURE',
          reason: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }

    // 3. Publish to ingestion.enriched
    await this.eventPublisher.publish(
      'ingestion.enriched',
      'EnrichedEventGenerated',
      currentEvent,
      { tenantId: currentEvent.canonicalEvent.tenantId, correlationId: currentEvent.canonicalEvent.correlationId }
    ).catch(e => console.error('Failed to publish enriched event', e));

    return currentEvent;
  }
}
