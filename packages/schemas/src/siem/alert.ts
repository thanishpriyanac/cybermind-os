import { EnrichedEvent } from '../normalization/enriched-event';

export type AlertStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'SUPPRESSED';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Alert {
  id: string;
  tenantId: string;

  // Source Detection
  ruleId: string;
  ruleName: string;
  ruleVersion: string;

  // Classification
  title: string;
  description: string;
  severity: AlertSeverity;
  confidence: number;         // 0–100

  // MITRE
  mitreTactics: string[];
  mitreTechniques: string[];

  // Event Evidence
  triggeringEvents: string[]; // event_id references
  eventCount: number;

  // Asset Context
  affectedAssetIds: string[];

  // Lifecycle
  status: AlertStatus;
  assigneeId?: string;
  suppressedUntil?: string;
  closedAt?: string;
  closureNotes?: string;

  // Timestamps
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;

  // Deduplication
  fingerprint: string;       // hash(ruleId + key event fields)
  occurrenceCount: number;   // how many times this alert has fired
}
