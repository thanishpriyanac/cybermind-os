import { EnrichmentProcessor, ProcessorResult } from './processor.interface';
import { EnrichedEvent } from '../../../../../packages/schemas/src/normalization/enriched-event';
import { CybermindAssetClient } from '../../../../../packages/sdk/asset-client/src/asset-client';

export class AssetEnricher implements EnrichmentProcessor {
  name = 'AssetEnricher';

  constructor(private readonly assetClient: CybermindAssetClient) {}

  async process(event: EnrichedEvent): Promise<ProcessorResult> {
    // If the connector already resolved it, fetch full context
    const assetId = event.canonicalEvent.assetId;
    
    if (!assetId) {
       return {
         event,
         metadata: { stage: this.name, status: 'SKIPPED', reason: 'No assetId in canonical event', timestamp: new Date().toISOString() }
       };
    }

    try {
      const assetData = await this.assetClient.getAssetById('SYSTEM_TOKEN', assetId);
      
      if (assetData) {
        event.asset = {
          id: assetData.id,
          type: assetData.type,
          businessService: assetData.metadata?.businessService,
          environment: assetData.metadata?.environment,
          riskProfile: assetData.riskProfile?.criticality,
          owner: assetData.identity?.ownerUserId
        };

        return {
          event,
          metadata: { stage: this.name, status: 'SUCCESS', timestamp: new Date().toISOString() }
        };
      }
    } catch (e) {
      // Enrichment failed, but pipeline continues
      return {
        event,
        metadata: { stage: this.name, status: 'FAILURE', reason: 'Asset lookup failed', timestamp: new Date().toISOString() }
      };
    }

    return {
      event,
      metadata: { stage: this.name, status: 'SKIPPED', timestamp: new Date().toISOString() }
    };
  }
}
