export interface DomainEvent<T = any> {
  eventId: string;
  eventType: string;
  occurredAt: string; // ISO timestamp
  version: number;
  correlationId: string;
  traceId: string;
  tenantId?: string;
  actorId?: string;
  source: string;
  conversationId?: string;
  turnId?: string;
  payload: T;
}
