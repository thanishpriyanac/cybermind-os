import { SigmaCompiler } from '../compiler/sigma.compiler';
import { AlertGenerator } from '../alerts/alert-generator';
import { RuleScheduler } from '../scheduler/rule-scheduler';
import { DetectionRule } from '../../../../packages/schemas/src/siem/detection-rule';
import { InMemoryRuleRepository } from '../repository/rule.repository';
import { ExecutionResult } from '../executor/query-executor';

const makeRule = (overrides?: Partial<DetectionRule>): DetectionRule => ({
  id: 'test-rule-001',
  version: '1.0.0',
  name: 'Test Brute Force',
  description: 'Test',
  author: 'test',
  tenantId: 'GLOBAL',
  category: 'AUTHENTICATION',
  tags: [],
  mitreTactics: ['Credential Access'],
  mitreTechniques: ['T1110'],
  severity: 'HIGH',
  confidence: 80,
  references: [],
  requiredFields: ['category'],
  minimumSchemaVersion: '1.0.0',
  schedule: { type: 'INTERVAL', value: '5m' },
  query: {
    language: 'sigma',
    expression: JSON.stringify({
      detection: {
        condition: 'keywords | all',
        keywords: ['LOGIN_FAILURE'],
        fields: { category: 'AUTHENTICATION' },
      },
    }),
  },
  alertTitle: 'Brute Force Detected',
  alertDescription: 'Multiple failed logins.',
  enabled: true,
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// ─── SigmaCompiler ────────────────────────────────────────────────────────────

describe('SigmaCompiler', () => {
  let compiler: SigmaCompiler;

  beforeEach(() => { compiler = new SigmaCompiler(); });

  it('should throw on invalid JSON expression', () => {
    expect(() => compiler.parse('not json')).toThrow('must be valid JSON');
  });

  it('should throw if detection block is missing', () => {
    expect(() => compiler.parse(JSON.stringify({}))).toThrow('missing "detection" block');
  });

  it('should parse a keyword condition into IntermediateQuery', () => {
    const result = compiler.parse(JSON.stringify({
      detection: { condition: 'keywords | all', keywords: ['LOGIN_FAILURE'] },
    }));
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0].value).toBe('LOGIN_FAILURE');
  });

  it('should include a field-specific condition', () => {
    const result = compiler.parse(JSON.stringify({
      detection: { condition: 'keywords | all', fields: { category: 'AUTHENTICATION' } },
    }));
    const catCond = result.conditions.find(c => c.field === 'category');
    expect(catCond?.value).toBe('AUTHENTICATION');
  });

  it('should add negated condition for "not" keywords', () => {
    const result = compiler.parse(JSON.stringify({
      detection: { condition: 'keywords | all', keywords: ['LOGIN_FAILURE'], not: ['SYSTEM'] },
    }));
    const negated = result.conditions.find(c => c.negate);
    expect(negated?.value).toBe('SYSTEM');
  });

  it('should compile to OpenSearch DSL with tenant_id filter', () => {
    const compiled = compiler.compile(
      'rule-001',
      JSON.stringify({ detection: { condition: 'keywords | all', keywords: ['LOGIN_FAILURE'] } }),
      'tenant-alpha',
      { from: '2026-07-01T00:00:00Z', to: '2026-07-28T23:59:59Z' }
    );
    const tenantFilter = compiled.openSearchDsl.bool.filter.find(
      (f: any) => f.term?.tenant_id === 'tenant-alpha'
    );
    expect(tenantFilter).toBeDefined();
  });

  it('should produce must_not clause for negated keywords', () => {
    const compiled = compiler.compile(
      'rule-001',
      JSON.stringify({ detection: { condition: 'keywords | all', not: ['SYSTEM'] } }),
      'tenant-alpha',
      { from: '2026-07-01T00:00:00Z', to: '2026-07-28T23:59:59Z' }
    );
    expect(compiled.openSearchDsl.bool.must_not).toBeDefined();
  });

  it('should apply additional severity filters', () => {
    const compiled = compiler.compile(
      'rule-001',
      JSON.stringify({
        detection: { condition: 'keywords | all', keywords: ['x'] },
        filters: { severities: ['HIGH', 'CRITICAL'] },
      }),
      'tenant-alpha',
      { from: '2026-07-01T00:00:00Z', to: '2026-07-28T23:59:59Z' }
    );
    const sevFilter = compiled.openSearchDsl.bool.filter.find(
      (f: any) => f.terms?.normalized_severity
    );
    expect(sevFilter).toBeDefined();
    expect(sevFilter.terms.normalized_severity).toContain('CRITICAL');
  });
});

// ─── AlertGenerator ──────────────────────────────────────────────────────────

describe('AlertGenerator', () => {
  let generator: AlertGenerator;
  const result: ExecutionResult = {
    ruleId: 'test-rule-001',
    tenantId: 'tenant-alpha',
    hitCount: 3,
    eventIds: ['evt-1', 'evt-2', 'evt-3'],
    executionTimeMs: 45,
  };

  beforeEach(() => { generator = new AlertGenerator(); });

  it('should generate an alert with populated fields', async () => {
    const rule = makeRule();
    const { alert } = await generator.generate(rule, result);
    expect(alert.ruleId).toBe('test-rule-001');
    expect(alert.severity).toBe('HIGH');
    expect(alert.triggeringEvents).toHaveLength(3);
    expect(alert.status).toBe('OPEN');
    expect(alert.fingerprint).toBeDefined();
  });

  it('should suppress duplicate alerts within the window', async () => {
    const rule = makeRule();
    const { suppressed: first } = await generator.generate(rule, result);
    const { suppressed: second } = await generator.generate(rule, result);
    expect(first).toBe(false);
    expect(second).toBe(true);
  });

  it('should produce different fingerprints for different rules', async () => {
    const rule1 = makeRule({ id: 'rule-A' });
    const rule2 = makeRule({ id: 'rule-B' });
    const { alert: a1 } = await generator.generate(rule1, { ...result, ruleId: 'rule-A' });
    const { alert: a2 } = await generator.generate(rule2, { ...result, ruleId: 'rule-B' });
    expect(a1.fingerprint).not.toBe(a2.fingerprint);
  });
});

// ─── RuleScheduler fixture validation ────────────────────────────────────────

describe('RuleScheduler.validateRule', () => {
  let scheduler: RuleScheduler;

  beforeEach(() => {
    scheduler = new RuleScheduler(
      new InMemoryRuleRepository(),
      new SigmaCompiler(),
      {} as any, // QueryExecutor not needed for validation
      new AlertGenerator(),
      {} as any, // AlertPublisher not needed
    );
  });

  it('should pass validation when positive fixture matches', async () => {
    const rule = makeRule({
      testFixtures: {
        positiveEvents: [
          { canonicalEvent: { normalizedData: { action: 'LOGIN_FAILURE' }, category: 'AUTHENTICATION' } as any },
        ],
        negativeEvents: [],
      },
    });
    const { passed } = await scheduler.validateRule(rule);
    expect(passed).toBe(true);
  });

  it('should fail validation if positive fixture does not match', async () => {
    const rule = makeRule({
      testFixtures: {
        positiveEvents: [
          { canonicalEvent: { normalizedData: { action: 'SOME_OTHER_EVENT' } } as any },
        ],
        negativeEvents: [],
      },
    });
    const { passed, failures } = await scheduler.validateRule(rule);
    expect(passed).toBe(false);
    expect(failures[0]).toContain('Positive fixture');
  });

  it('should fail validation if negative fixture unexpectedly matches', async () => {
    const rule = makeRule({
      testFixtures: {
        positiveEvents: [],
        negativeEvents: [
          { canonicalEvent: { normalizedData: { action: 'LOGIN_FAILURE' } } as any },
        ],
      },
    });
    const { passed } = await scheduler.validateRule(rule);
    expect(passed).toBe(false);
  });
});
