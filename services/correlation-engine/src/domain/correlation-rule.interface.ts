import { Alert } from '../../../../packages/schemas/src/siem/alert';

export type CorrelationWindowType = 'SLIDING' | 'TUMBLING' | 'SESSION';

export interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  tenantId: string | 'GLOBAL';
  enabled: boolean;

  // What events to watch
  eventFilters: {
    categories?: string[];
    actions?: string[];
    sources?: string[];
  };

  // Correlation logic
  conditions: {
    type: 'COUNT' | 'SEQUENCE' | 'THRESHOLD';
    threshold?: number;         // COUNT / THRESHOLD: minimum events
    windowMinutes: number;
    groupBy: string[];           // e.g., ['asset.id', 'tenant_id']
    sequence?: string[];         // SEQUENCE: ordered actions
  };

  // Output
  alertTitle: string;
  severity: Alert['severity'];
  mitreTactics: string[];
  confidence: number;
}

export interface CorrelationSession {
  sessionId: string;
  tenantId: string;
  ruleId: string;
  groupKey: string;            // composite group-by value
  events: { eventId: string; eventTime: string; action?: string }[];
  openedAt: string;
  expiresAt: string;
  matchedAt?: string;
}
