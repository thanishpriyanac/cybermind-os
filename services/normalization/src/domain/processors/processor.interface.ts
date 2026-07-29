import { EnrichedEvent, EnrichmentMetadata } from '../../../../../packages/schemas/src/normalization/enriched-event';

export interface ProcessorResult {
  event: EnrichedEvent;
  metadata: EnrichmentMetadata;
}

export interface EnrichmentProcessor {
  name: string;
  process(event: EnrichedEvent): Promise<ProcessorResult>;
}
