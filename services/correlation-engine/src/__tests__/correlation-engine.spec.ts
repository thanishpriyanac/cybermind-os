import { CorrelationEngine } from '../processors/correlation-engine';
import { CorrelationRule } from '../domain/correlation-rule.interface';
import { EnrichedEvent } from '../../../../packages/schemas/src/normalization/enriched-event';

const bruteForceRule: CorrelationRule = {
  id: 'corr-brute-001',
  name: 'Brute Force Correlation',
  description: 'Detects 3+ failed logins on the same asset within 2 minutes',
  tenantId: 'GLOBAL',
  enabled: true,
  eventFilters: { categories: ['AUTHENTICATION'], actions: ['LOGIN_FAILURE'] },
  conditions: { type: 'COUNT', threshold: 3, windowMinutes: 2, groupBy: ['asset.id', 'tenant_id'] },
  alertTitle: 'Brute Force Attack Detected',
  severity: 'HIGH',
  mitreTactics: ['Credential Access'],
  confidence: 85,
};

const makeEvent = (assetId: string, tenantId = 'tenant-alpha'): EnrichedEvent => ({
  canonicalEvent: {
    eventId: `evt-${Math.random().toString(36).slice(2)}`,
    tenantId,
    eventTime: new Date().toISOString(),
    source: 'syslog',
    category: 'AUTHENTICATION',
    severity: 'HIGH',
    correlationId: 'corr-test',
    rawPayload: '',
    normalizedData: { action: 'LOGIN_FAILURE' },
  },
  asset: { id: assetId, type: 'SERVER' },
  normalizedSeverity: 'HIGH',
  confidenceScore: 70,
  enrichmentMetadata: [],
});

describe('CorrelationEngine', () => {
  let engine: CorrelationEngine;

  beforeEach(() => {
    engine = new CorrelationEngine();
    engine.registerRule(bruteForceRule);
  });

  it('should not alert on fewer than threshold events', async () => {
    const alerts = await engine.processEvent(makeEvent('asset-001'));
    expect(alerts).toHaveLength(0);
  });

  it('should generate an alert when threshold is reached', async () => {
    await engine.processEvent(makeEvent('asset-001'));
    await engine.processEvent(makeEvent('asset-001'));
    const alerts = await engine.processEvent(makeEvent('asset-001'));
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('HIGH');
    expect(alerts[0].eventCount).toBe(3);
  });

  it('should track different assets independently', async () => {
    await engine.processEvent(makeEvent('asset-001'));
    await engine.processEvent(makeEvent('asset-001'));
    await engine.processEvent(makeEvent('asset-002')); // different asset
    const alerts = await engine.processEvent(makeEvent('asset-001'));
    expect(alerts).toHaveLength(1); // only asset-001 crossed threshold
  });

  it('should reset the session after a match', async () => {
    for (let i = 0; i < 3; i++) await engine.processEvent(makeEvent('asset-001'));
    const sessionCountAfterMatch = engine.getSessionCount();
    expect(sessionCountAfterMatch).toBe(0);
  });

  it('should not match events for a different tenant', async () => {
    await engine.processEvent(makeEvent('asset-001', 'tenant-alpha'));
    await engine.processEvent(makeEvent('asset-001', 'tenant-beta')); // different tenant
    const alerts = await engine.processEvent(makeEvent('asset-001', 'tenant-alpha'));
    expect(alerts).toHaveLength(0); // only 2 events for tenant-alpha
  });
});
