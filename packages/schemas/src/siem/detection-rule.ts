import { EnrichedEvent } from '../normalization/enriched-event';

export type RuleStatus = 'DRAFT' | 'TESTING' | 'ACTIVE' | 'DISABLED';
export type RuleScheduleType = 'INTERVAL' | 'CRON';
export type RuleQueryLanguage = 'sigma' | 'opensearch_dsl';

export interface DetectionRule {
  // Identity
  id: string;                      // UUIDv4
  version: string;                 // Semver e.g. "1.0.0"
  name: string;
  description: string;
  author: string;
  tenantId: string | 'GLOBAL';    // GLOBAL = platform-wide rule

  // Classification
  category: string;
  tags: string[];
  mitreTactics: string[];
  mitreTechniques: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;              // 0–100

  // Documentation
  references: string[];
  falsePositiveNotes?: string;
  requiredFields: string[];        // Fields that must exist on events for the rule to apply
  minimumSchemaVersion: string;   // e.g., "1.0.0"

  // Scheduling
  schedule: {
    type: RuleScheduleType;
    value: string;                 // e.g., '5m' or '*/5 * * * *'
  };

  // Query
  query: {
    language: RuleQueryLanguage;
    expression: string;
  };

  // Output
  alertTitle: string;             // Supports template variables e.g. "{user} failed login"
  alertDescription: string;

  // Lifecycle
  enabled: boolean;
  status: RuleStatus;
  createdAt: string;
  updatedAt: string;

  // Test Fixtures
  testFixtures?: {
    positiveEvents: Partial<EnrichedEvent>[];   // Must trigger alert
    negativeEvents: Partial<EnrichedEvent>[];   // Must NOT trigger
  };
}
