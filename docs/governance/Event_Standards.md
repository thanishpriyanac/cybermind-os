# Event Standards

This document governs asynchronous domain events flowing through Redpanda.

## 1. Event Naming & Format
- Format: `[Domain][Entity][PastTenseVerb]` (e.g., `IdentityUserCreated`, `SiemAlertGenerated`).
- Schema format: JSON or Protobuf, strictly versioned.

## 2. Standard Envelope
All events must conform to CloudEvents specification v1.0.
```json
{
  "specversion": "1.0",
  "type": "io.cybermind.siem.alert.generated.v1",
  "source": "/services/siem",
  "id": "A234-5678-9012",
  "time": "2026-07-28T20:00:00Z",
  "datacontenttype": "application/json",
  "data": { ... }
}
```

## 3. Correlation & Causation IDs
- `correlationId`: Passed through from the initial API request or triggering event.
- `causationId`: The ID of the specific event that directly caused this event.

## 4. Tenant Context
- Multi-tenancy is enforced. Every event MUST carry a `tenantId` in the CloudEvents extension fields.

## 5. Ordering Guarantees
- Use the Entity ID (e.g., `caseId`) as the Kafka Partition Key to guarantee ordered processing for state changes of the same entity.

## 6. Dead-Letter Handling
- Consumers must not block infinitely on malformed events. 
- Failed processing (after retries) must route the event to a `<topic_name>_dlq` for manual inspection.
