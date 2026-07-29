import { EnrichmentProcessor, ProcessorResult } from './processor.interface';
import { EnrichedEvent } from '../../../../../packages/schemas/src/normalization/enriched-event';

export class SeverityNormalizer implements EnrichmentProcessor {
  name = 'SeverityNormalizer';

  async process(event: EnrichedEvent): Promise<ProcessorResult> {
    const rawSeverity = event.canonicalEvent.severity?.toUpperCase() || 'INFORMATIONAL';

    let normalized: EnrichedEvent['normalizedSeverity'] = 'INFORMATIONAL';

    if (['CRITICAL', 'FATAL', 'EMERGENCY'].includes(rawSeverity)) {
      normalized = 'CRITICAL';
    } else if (['HIGH', 'ERROR', 'SEVERE'].includes(rawSeverity)) {
      normalized = 'HIGH';
    } else if (['MEDIUM', 'WARNING', 'WARN'].includes(rawSeverity)) {
      normalized = 'MEDIUM';
    } else if (['LOW', 'NOTICE'].includes(rawSeverity)) {
      normalized = 'LOW';
    }

    event.normalizedSeverity = normalized;

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
