import { ConnectorPlugin, ParsedEvent } from '../../domain/plugins/connector.plugin';
import { CanonicalEvent } from '@cybermind/schemas';
import { CybermindAssetClient } from '@cybermind-os/asset-client';

import { RFC3164Parser } from './parsers/protocol/rfc3164.parser';
import { RFC5424Parser } from './parsers/protocol/rfc5424.parser';
import { LinuxParser } from './parsers/semantic/linux.parser';
import { FirewallParser } from './parsers/semantic/firewall.parser';
import { StructuredSyslog } from './structured-syslog.interface';

export class SyslogPlugin implements ConnectorPlugin {
  private readonly rfc3164 = new RFC3164Parser();
  private readonly rfc5424 = new RFC5424Parser();
  private readonly semanticParsers = [new LinuxParser(), new FirewallParser()];

  constructor(private readonly assetClient: CybermindAssetClient) {}

  async validate(config: unknown): Promise<void> {}

  async collect(config: unknown): Promise<unknown[]> {
    return []; // Handled upstream by ingestion.raw.syslog Kafka consumer
  }

  async parse(data: unknown[]): Promise<ParsedEvent[]> {
    return data.map(rawMsg => {
      const msgStr = String(rawMsg);
      
      // 1. Protocol Parsing
      let structuredMsg: StructuredSyslog | null = null;
      if (msgStr.includes(' <1') || msgStr.match(/^<\d+>\d/)) {
        structuredMsg = this.rfc5424.parse(msgStr);
      } else {
        structuredMsg = this.rfc3164.parse(msgStr);
      }

      if (!structuredMsg) {
        return {
          originalPayload: msgStr,
          extractedFields: { category: 'UNKNOWN', action: 'UNPARSABLE_SYSLOG' },
          assetResolved: false,
        };
      }

      // 2. Semantic Routing
      for (const parser of this.semanticParsers) {
        if (parser.supports(structuredMsg)) {
          return parser.parse(structuredMsg);
        }
      }

      // Fallback if no device parser matched
      return {
        originalPayload: msgStr,
        extractedFields: { category: 'UNKNOWN', action: 'UNSUPPORTED_DEVICE' },
        hostname: structuredMsg.hostname,
        assetResolved: false,
      };
    });
  }

  async resolveAssets(events: ParsedEvent[]): Promise<ParsedEvent[]> {
    for (const event of events) {
      const identifier = event.ipAddress || event.hostname;
      if (identifier) {
        try {
          const result = await this.assetClient.searchAssets('SYSTEM_TOKEN', { query: identifier });
          if (result && result.length > 0) {
            event.assetId = result[0].id;
            event.assetResolved = true;
          }
        } catch (e) {
          // Ignore failures
        }
      }
    }
    return events;
  }

  async transform(events: ParsedEvent[]): Promise<CanonicalEvent[]> {
    return events.map(event => ({
      eventId: `syslog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId: event.extractedFields.tenantId || 'UNKNOWN',
      assetId: event.assetId,
      eventTime: new Date().toISOString(),
      source: 'syslog',
      category: event.extractedFields.category,
      severity: 'INFORMATIONAL',
      correlationId: `corr-${Date.now()}`,
      rawPayload: String(event.originalPayload),
      normalizedData: event.extractedFields,
    }));
  }
}
