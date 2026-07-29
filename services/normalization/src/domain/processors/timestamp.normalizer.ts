import { EnrichmentProcessor, ProcessorResult } from './processor.interface';
import { EnrichedEvent } from '../../../../../packages/schemas/src/normalization/enriched-event';

export class TimestampNormalizer implements EnrichmentProcessor {
  name = 'TimestampNormalizer';

  async process(event: EnrichedEvent): Promise<ProcessorResult> {
    const originalTime = event.canonicalEvent.eventTime;
    let parsedDate = new Date(originalTime);

    // Fallback to current time if parsing fails
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date();
    }

    event.canonicalEvent.eventTime = parsedDate.toISOString();

    return {
      event,
      metadata: {
        stage: this.name,
        status: 'SUCCESS',
        timestamp: new Date().toISOString()
      }
    };
  }
}
