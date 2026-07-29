export interface CloudEvent<T = any> {
  // Core CloudEvents 1.0 attributes
  id: string; // Unique event ID
  source: string; // The service emitting the event (e.g., /cybermind/identity)
  type: string; // The event type (e.g., UserLoggedIn)
  specversion: string; // Fixed to '1.0'
  subject?: string; // e.g., the user ID
  time: string; // ISO8601 Timestamp
  datacontenttype: string; // 'application/json'
  data: T; // Strongly typed payload

  // CYBERMIND Extensions
  tenantId?: string;
  correlationId?: string;
  causationId?: string;
  traceId?: string;
  actorId?: string;
  schemaVersion: string;
  platformVersion: string;
}

export interface PublishOptions {
  correlationId?: string;
  tenantId?: string;
  causationId?: string;
  traceId?: string;
  actorId?: string;
}
