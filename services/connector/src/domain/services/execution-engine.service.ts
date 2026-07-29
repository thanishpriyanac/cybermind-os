import { Injectable } from '@nestjs/common';
import { CybermindKafkaPublisher } from '@cybermind-os/event-client';
import { ConnectorPlugin } from '../plugins/connector.plugin';

@Injectable()
export class ExecutionEngine {
  constructor(private readonly eventPublisher: CybermindKafkaPublisher) {}

  async runPipeline(tenantId: string, connectorId: string, plugin: ConnectorPlugin, config: any) {
    console.log(`Starting execution for connector ${connectorId}`);
    
    // 1. Collect
    const rawData = await plugin.collect(config);
    
    // 2. Validate
    await plugin.validate(config);
    
    // 3. Parse
    const parsedEvents = await plugin.parse(rawData);
    
    // 4. Asset Resolution
    const resolvedEvents = await plugin.resolveAssets(parsedEvents);
    
    // 5. Transform (Canonicalize)
    const canonicalEvents = await plugin.transform(resolvedEvents);
    
    // 6. Publish
    let published = 0;
    for (const canonicalEvent of canonicalEvents) {
      await this.eventPublisher.publish(
        'ingestion.canonical',
        'CanonicalEventEmitted',
        canonicalEvent,
        { tenantId, correlationId: canonicalEvent.correlationId }
      ).catch(e => console.error('Failed to publish canonical event', e));
      published++;
    }
    
    console.log(`Successfully published ${published} CanonicalEvents for connector ${connectorId}`);
    return { status: 'SUCCESS', recordsPublished: published };
  }
}
