import { NormalizationEngine } from '../../domain/services/normalization-engine.service';
import { TimestampNormalizer } from '../../domain/processors/timestamp.normalizer';
import { SeverityNormalizer } from '../../domain/processors/severity.normalizer';
import { MitreMapper } from '../../domain/processors/mitre.mapper';
import { ConfidenceCalculator } from '../../domain/processors/confidence.calculator';
import { CanonicalEvent } from '../../../../../packages/schemas/src/connector/canonical-event';

// Mock the event publisher
const mockPublisher = {
  publish: jest.fn().mockResolvedValue(undefined),
};

describe('NormalizationEngine – Pipeline Integration', () => {
  let engine: NormalizationEngine;

  const buildCanonical = (overrides?: Partial<CanonicalEvent>): CanonicalEvent => ({
    eventId: 'test-event-id-001',
    tenantId: 'tenant-alpha',
    eventTime: '2026-07-28T10:00:00Z',
    source: 'windows-event-log',
    category: 'AUTHENTICATION',
    severity: 'ERROR',
    correlationId: 'corr-001',
    rawPayload: '{"EventID":4625}',
    normalizedData: { action: 'LOGIN_FAILURE' },
    ...overrides,
  });

  beforeEach(() => {
    engine = new NormalizationEngine(mockPublisher as any);
    engine.registerProcessors([
      new TimestampNormalizer(),
      new SeverityNormalizer(),
      new MitreMapper(),
      new ConfidenceCalculator(),
    ]);
    jest.clearAllMocks();
  });

  it('should run the full pipeline and return an EnrichedEvent', async () => {
    const result = await engine.processEvent(buildCanonical());

    expect(result).toBeDefined();
    expect(result.canonicalEvent.eventId).toBe('test-event-id-001');
  });

  it('should normalize severity from ERROR to HIGH', async () => {
    const result = await engine.processEvent(buildCanonical({ severity: 'ERROR' }));
    expect(result.normalizedSeverity).toBe('HIGH');
  });

  it('should normalize severity from CRITICAL correctly', async () => {
    const result = await engine.processEvent(buildCanonical({ severity: 'CRITICAL' }));
    expect(result.normalizedSeverity).toBe('CRITICAL');
  });

  it('should map LOGIN_FAILURE to MITRE T1110 (Brute Force)', async () => {
    const result = await engine.processEvent(
      buildCanonical({ normalizedData: { action: 'LOGIN_FAILURE' } })
    );
    expect(result.mitre).toBeDefined();
    expect(result.mitre![0].id).toBe('T1110');
    expect(result.mitre![0].tactic).toBe('Credential Access');
  });

  it('should map PROCESS_CREATED to MITRE T1059 (Execution)', async () => {
    const result = await engine.processEvent(
      buildCanonical({ category: 'PROCESS', normalizedData: { action: 'PROCESS_CREATED' } })
    );
    expect(result.mitre![0].id).toBe('T1059');
  });

  it('should boost confidence when MITRE mapping is present', async () => {
    const noMitreResult = await engine.processEvent(
      buildCanonical({ category: 'UNKNOWN', normalizedData: { action: 'NOTHING' } })
    );
    const mitreResult = await engine.processEvent(
      buildCanonical({ normalizedData: { action: 'LOGIN_FAILURE' } })
    );
    expect(mitreResult.confidenceScore).toBeGreaterThan(noMitreResult.confidenceScore);
  });

  it('should normalize timestamp to ISO 8601', async () => {
    const result = await engine.processEvent(buildCanonical({ eventTime: '2026-07-28T10:00:00Z' }));
    expect(new Date(result.canonicalEvent.eventTime).toISOString()).toBe('2026-07-28T10:00:00.000Z');
  });

  it('should record enrichment metadata for each stage', async () => {
    const result = await engine.processEvent(buildCanonical());
    const stages = result.enrichmentMetadata.map(m => m.stage);
    expect(stages).toContain('TimestampNormalizer');
    expect(stages).toContain('SeverityNormalizer');
    expect(stages).toContain('MitreMapper');
    expect(stages).toContain('ConfidenceCalculator');
  });

  it('should publish the enriched event to ingestion.enriched', async () => {
    await engine.processEvent(buildCanonical());
    expect(mockPublisher.publish).toHaveBeenCalledWith(
      'ingestion.enriched',
      'EnrichedEventGenerated',
      expect.anything(),
      expect.objectContaining({ tenantId: 'tenant-alpha' })
    );
  });

  it('should continue processing even if one stage throws', async () => {
    const brokenProcessor = {
      name: 'BrokenProcessor',
      process: jest.fn().mockRejectedValue(new Error('Stage failure')),
    };
    engine.registerProcessors([brokenProcessor, new ConfidenceCalculator()]);

    const result = await engine.processEvent(buildCanonical());

    // Pipeline should survive the broken stage
    expect(result).toBeDefined();
    const failed = result.enrichmentMetadata.find(m => m.stage === 'BrokenProcessor');
    expect(failed?.status).toBe('FAILURE');
    expect(failed?.reason).toBe('Stage failure');
  });
});
