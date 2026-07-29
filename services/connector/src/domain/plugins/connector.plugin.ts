import { CanonicalEvent } from '@cybermind/schemas';

export interface ParsedEvent {
  originalPayload: unknown;
  extractedFields: Record<string, any>;
  
  // High-level resolution targets
  agentId?: string;
  hostname?: string;
  fqdn?: string;
  ipAddress?: string;
  macAddress?: string;
  
  // Mapping state
  assetId?: string;
  assetResolved: boolean;
}

export interface ConnectorPlugin {
  validate(config: unknown): Promise<void>;
  collect(config: unknown): Promise<unknown[]>;
  parse(data: unknown[]): Promise<ParsedEvent[]>;
  resolveAssets(events: ParsedEvent[]): Promise<ParsedEvent[]>;
  transform(events: ParsedEvent[]): Promise<CanonicalEvent[]>;
}
