import { EnrichmentProcessor, ProcessorResult } from './processor.interface';
import { EnrichedEvent } from '../../../../../packages/schemas/src/normalization/enriched-event';

export class MitreMapper implements EnrichmentProcessor {
  name = 'MitreMapper';

  async process(event: EnrichedEvent): Promise<ProcessorResult> {
    const action = event.canonicalEvent.normalizedData?.action;
    const category = event.canonicalEvent.category;

    const mitreTags = [];

    // Rule-based mapping MVP
    if (action === 'PROCESS_CREATED' || action === 'POWERSHELL_EXECUTION') {
      mitreTags.push({ tactic: 'Execution', technique: 'Command and Scripting Interpreter', id: 'T1059' });
    }
    
    if (action === 'LOGIN_FAILURE') {
      mitreTags.push({ tactic: 'Credential Access', technique: 'Brute Force', id: 'T1110' });
    }

    if (action === 'CONNECTION_BLOCKED' && category === 'NETWORK') {
       // Just mapping to network defense for context
       mitreTags.push({ tactic: 'Defense Evasion', technique: 'Impair Defenses', id: 'T1562' });
    }

    if (mitreTags.length > 0) {
      event.mitre = mitreTags;
    }

    return {
      event,
      metadata: {
        stage: this.name,
        status: mitreTags.length > 0 ? 'SUCCESS' : 'SKIPPED',
        timestamp: new Date().toISOString()
      }
    };
  }
}
