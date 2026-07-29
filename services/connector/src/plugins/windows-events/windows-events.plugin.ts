import { ConnectorPlugin, ParsedEvent } from '../../domain/plugins/connector.plugin';
import { CanonicalEvent } from '../../../../../packages/schemas/src/connector/canonical-event';
import { AuthenticationParser } from './parsers/authentication.parser';
import { CybermindAssetClient } from '../../../../../packages/sdk/asset-client/src/asset-client';

export class WindowsEventPlugin implements ConnectorPlugin {
  private readonly authParser = new AuthenticationParser();
  
  constructor(private readonly assetClient: CybermindAssetClient) {}

  async validate(config: unknown): Promise<void> {
    // Validate kafka topic or webhook endpoints here
  }

  async collect(config: unknown): Promise<unknown[]> {
    // Hybrid Transport Layer logic would reside here. 
    // E.g., if Kafka, this pulls a batch from ingestion.raw.windows
    return [];
  }

  async parse(data: unknown[]): Promise<ParsedEvent[]> {
    return data.map(raw => {
      // Very crude multiplexing for MVP. A real implementation uses a router or switch.
      const eventIdStr = JSON.stringify(raw);
      if (eventIdStr.includes('4624') || eventIdStr.includes('4625')) {
        return this.authParser.parse(raw);
      }
      
      // Fallback for unparsed events
      return {
        originalPayload: raw,
        extractedFields: { category: 'UNKNOWN', action: 'UNKNOWN' },
        assetResolved: false,
      };
    });
  }

  async resolveAssets(events: ParsedEvent[]): Promise<ParsedEvent[]> {
    // Attempt resolution
    // Note: For a high-throughput pipeline, we would batch these lookups.
    for (const event of events) {
      if (event.hostname) {
        try {
          // Assume the engine injects a SYSTEM token for internal SDK calls
          const result = await this.assetClient.searchAssets('SYSTEM_TOKEN', { hostname: event.hostname });
          if (result && result.length > 0) {
            event.assetId = result[0].id;
            event.assetResolved = true;
          }
        } catch (e) {
          // Ignore failures, asset remains unresolved
        }
      }
    }
    return events;
  }

  async transform(events: ParsedEvent[]): Promise<CanonicalEvent[]> {
    return events.map(event => ({
      eventId: `wec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId: event.extractedFields.tenantId || 'UNKNOWN',
      assetId: event.assetId,
      eventTime: new Date().toISOString(), // Fallback if missing in raw
      source: 'windows-event-log',
      category: event.extractedFields.category,
      severity: 'INFORMATIONAL', // Simplified for MVP
      correlationId: `corr-${Date.now()}`,
      rawPayload: JSON.stringify(event.originalPayload),
      normalizedData: event.extractedFields,
    }));
  }
}
