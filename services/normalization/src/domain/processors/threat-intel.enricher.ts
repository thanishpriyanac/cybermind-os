import { EnrichmentProcessor, ProcessorResult } from './processor.interface';
import { EnrichedEvent } from '../../../../../packages/schemas/src/normalization/enriched-event';
import { ThreatIntelProvider } from './threat-intel.provider.interface';

export class ThreatIntelEnricher implements EnrichmentProcessor {
  name = 'ThreatIntelEnricher';

  constructor(private readonly providers: ThreatIntelProvider[]) {}

  async process(event: EnrichedEvent): Promise<ProcessorResult> {
    const data = event.canonicalEvent.normalizedData;
    if (!data) {
      return { event, metadata: { stage: this.name, status: 'SKIPPED', timestamp: new Date().toISOString() } };
    }

    const iocs = [];
    if (data.ipAddress) iocs.push({ type: 'ip', value: data.ipAddress });
    if (data.sourceIp) iocs.push({ type: 'ip', value: data.sourceIp });
    if (data.destIp) iocs.push({ type: 'ip', value: data.destIp });
    if (data.domain) iocs.push({ type: 'domain', value: data.domain });

    const threatHits = [];

    for (const ioc of iocs) {
      for (const provider of this.providers) {
        try {
          let res;
          if (ioc.type === 'ip') res = await provider.checkIp(ioc.value);
          else if (ioc.type === 'domain') res = await provider.checkDomain(ioc.value);
          
          if (res?.hit) {
            threatHits.push({ provider: provider.name, ...res });
          }
        } catch (e) {
          // Swallow provider errors, continue pipeline
        }
      }
    }

    if (threatHits.length > 0) {
      event.threatIntel = threatHits;
    }

    return {
      event,
      metadata: {
        stage: this.name,
        status: threatHits.length > 0 ? 'SUCCESS' : 'SKIPPED',
        timestamp: new Date().toISOString()
      }
    };
  }
}
