import { EnrichmentProcessor, ProcessorResult } from './processor.interface';
import { EnrichedEvent } from '../../../../../packages/schemas/src/normalization/enriched-event';

export class ConfidenceCalculator implements EnrichmentProcessor {
  name = 'ConfidenceCalculator';

  async process(event: EnrichedEvent): Promise<ProcessorResult> {
    let score = 50; // Base score

    // Asset Resolution Confidence
    if (event.asset) {
      score += 20;
    }

    // Threat Intel hits vastly increase confidence
    if (event.threatIntel && event.threatIntel.length > 0) {
      score += 30;
    }

    // MITRE Mapping gives structural confidence
    if (event.mitre && event.mitre.length > 0) {
      score += 10;
    }

    // Cap at 100
    event.confidenceScore = Math.min(score, 100);

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
