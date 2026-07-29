export interface CanonicalEvent<T = any> {
  eventId: string;          // Unique ID for the canonical event
  tenantId: string;         // Enforced tenant boundary
  assetId?: string;         // CYBERMIND internal Asset ID if resolved during ingestion
  
  eventTime: string;        // ISO8601 Timestamp of when the event originally occurred
  source: string;           // E.g., 'syslog', 'windows-event-log', 'aws-cloudtrail'
  category: string;         // E.g., 'NETWORK', 'AUTHENTICATION', 'PROCESS', 'DATA_ACCESS'
  severity: string;         // Mapped to Platform Metadata SeverityLevel (e.g. 'HIGH')
  
  correlationId: string;    // Distributed trace correlation
  
  rawPayload: string;       // Original unparsed payload for auditing/re-parsing
  normalizedData: T;        // Structured JSON payload containing parsed event details
}
