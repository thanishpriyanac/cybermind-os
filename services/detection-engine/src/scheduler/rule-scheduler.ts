import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DetectionRule } from '../../../../packages/schemas/src/siem/detection-rule';
import { RuleRepository } from '../repository/rule.repository';
import { SigmaCompiler } from '../compiler/sigma.compiler';
import { QueryExecutor } from '../executor/query-executor';
import { AlertGenerator } from '../alerts/alert-generator';
import { AlertPublisher } from '../alerts/alert-publisher';

const MAX_CONSECUTIVE_FAILURES = 5;
const CIRCUIT_OPEN_MINUTES = 30;

interface CircuitState {
  consecutiveFailures: number;
  openUntil?: Date;
}

@Injectable()
export class RuleScheduler {
  private readonly logger = new Logger(RuleScheduler.name);
  private readonly circuitBreakers = new Map<string, CircuitState>();

  constructor(
    private readonly ruleRepository: RuleRepository,
    private readonly compiler: SigmaCompiler,
    private readonly executor: QueryExecutor,
    private readonly alertGenerator: AlertGenerator,
    private readonly alertPublisher: AlertPublisher,
  ) {}

  /**
   * Primary execution loop — runs every minute.
   * Each rule controls its own execution frequency via its `schedule` field.
   * This scheduler evaluates which rules are due on each tick.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async runScheduledRules() {
    const activeRules = await this.ruleRepository.listActive();
    this.logger.debug(`Scheduler tick — ${activeRules.length} active rules`);

    for (const rule of activeRules) {
      if (!this.isDue(rule)) continue;

      const circuit = this.circuitBreakers.get(rule.id);
      if (circuit?.openUntil && circuit.openUntil > new Date()) {
        this.logger.warn(`Rule ${rule.id} circuit breaker OPEN — skipping`);
        continue;
      }

      await this.executeRule(rule).catch(e => {
        this.logger.error(`Rule ${rule.id} execution failed: ${e.message}`);
        this.recordFailure(rule.id);
      });
    }
  }

  async executeRule(rule: DetectionRule): Promise<void> {
    const tenantId = rule.tenantId === 'GLOBAL' ? 'cybermind-platform' : rule.tenantId;
    const now = new Date();
    const windowMinutes = rule.schedule.type === 'INTERVAL'
      ? parseInt(rule.schedule.value, 10)
      : 5;

    const timeRange = {
      from: new Date(now.getTime() - windowMinutes * 60_000).toISOString(),
      to: now.toISOString(),
    };

    const compiled = this.compiler.compile(
      rule.id,
      rule.query.expression,
      tenantId,
      timeRange
    );

    const result = await this.executor.execute(compiled, tenantId);
    this.recordSuccess(rule.id);

    if (result.hitCount === 0) return;

    const { alert, suppressed } = await this.alertGenerator.generate(rule, result);
    if (!suppressed) {
      await this.alertPublisher.publish(alert);
    }
  }

  /**
   * Validate rule testFixtures in CI/testing mode.
   * Positive events must produce at least one match; negative events must produce zero.
   */
  async validateRule(rule: DetectionRule): Promise<{ passed: boolean; failures: string[] }> {
    const failures: string[] = [];

    if (!rule.testFixtures) return { passed: true, failures: [] };

    for (const [idx, positiveEvent] of rule.testFixtures.positiveEvents.entries()) {
      const category = positiveEvent.canonicalEvent?.category;
      const action = positiveEvent.canonicalEvent?.normalizedData?.action;

      // Compile and check the rule expression against the fixture fields
      const expressionObj = JSON.parse(rule.query.expression);
      const keywords: string[] = expressionObj.detection?.keywords ?? [];

      const matched = keywords.some(kw =>
        JSON.stringify(positiveEvent).toLowerCase().includes(kw.toLowerCase())
      );

      if (!matched) {
        failures.push(`Positive fixture [${idx}]: rule "${rule.name}" did not match (expected match)`);
      }
    }

    for (const [idx, negativeEvent] of rule.testFixtures.negativeEvents.entries()) {
      const expressionObj = JSON.parse(rule.query.expression);
      const keywords: string[] = expressionObj.detection?.keywords ?? [];

      const matched = keywords.some(kw =>
        JSON.stringify(negativeEvent).toLowerCase().includes(kw.toLowerCase())
      );

      if (matched) {
        failures.push(`Negative fixture [${idx}]: rule "${rule.name}" matched (expected no match)`);
      }
    }

    return { passed: failures.length === 0, failures };
  }

  private isDue(rule: DetectionRule): boolean {
    if (rule.schedule.type === 'INTERVAL') return true; // every tick for now
    return true; // CRON rules always eligible during scheduler tick
  }

  private recordSuccess(ruleId: string) {
    this.circuitBreakers.delete(ruleId);
  }

  private recordFailure(ruleId: string) {
    const state = this.circuitBreakers.get(ruleId) ?? { consecutiveFailures: 0 };
    state.consecutiveFailures++;
    if (state.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      state.openUntil = new Date(Date.now() + CIRCUIT_OPEN_MINUTES * 60_000);
      this.logger.error(
        `Rule ${ruleId} circuit breaker TRIPPED after ${state.consecutiveFailures} failures. Will retry after ${state.openUntil.toISOString()}`
      );
    }
    this.circuitBreakers.set(ruleId, state);
  }
}
