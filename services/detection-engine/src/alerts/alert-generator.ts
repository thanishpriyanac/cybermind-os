import { Injectable, Logger } from '@nestjs/common';
import { Alert } from '../../../../packages/schemas/src/siem/alert';
import { DetectionRule } from '../../../../packages/schemas/src/siem/detection-rule';
import { ExecutionResult } from '../executor/query-executor';
import * as crypto from 'crypto';

/**
 * AlertGenerator
 *
 * Generates `Alert` objects from detection rule execution results.
 * Implements fingerprint-based deduplication using a configurable suppression window.
 * An alert with the same fingerprint within the window is suppressed rather than duplicated.
 */

const DEFAULT_SUPPRESSION_WINDOW_MINUTES = 60;

interface SuppressionRecord {
  alertId: string;
  suppressedUntil: Date;
  occurrenceCount: number;
}

@Injectable()
export class AlertGenerator {
  private readonly logger = new Logger(AlertGenerator.name);

  // In-memory suppression store (Sprint 15 will back this with Redis/Postgres)
  private readonly suppressionStore = new Map<string, SuppressionRecord>();

  async generate(
    rule: DetectionRule,
    result: ExecutionResult,
  ): Promise<{ alert: Alert; suppressed: boolean }> {
    const fingerprint = this.buildFingerprint(rule, result);
    const now = new Date();

    // Check suppression window
    const existing = this.suppressionStore.get(fingerprint);
    if (existing && existing.suppressedUntil > now) {
      existing.occurrenceCount++;
      this.logger.debug(
        `Alert suppressed (fingerprint=${fingerprint}, occurrences=${existing.occurrenceCount})`
      );
      return {
        alert: await this.buildAlert(rule, result, fingerprint, existing.occurrenceCount),
        suppressed: true,
      };
    }

    // New alert — register suppression window
    const suppressionWindowMs =
      (rule.schedule?.value?.endsWith('m')
        ? parseInt(rule.schedule.value, 10)
        : DEFAULT_SUPPRESSION_WINDOW_MINUTES) * 60_000;

    this.suppressionStore.set(fingerprint, {
      alertId: `alert-${fingerprint.slice(0, 8)}`,
      suppressedUntil: new Date(now.getTime() + suppressionWindowMs),
      occurrenceCount: 1,
    });

    const alert = await this.buildAlert(rule, result, fingerprint, 1);
    this.logger.log(`Alert generated: ${alert.id} (rule: ${rule.name})`);
    return { alert, suppressed: false };
  }

  private buildFingerprint(rule: DetectionRule, result: ExecutionResult): string {
    const key = `${result.tenantId}:${rule.id}:${rule.category}`;
    return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
  }

  private async buildAlert(
    rule: DetectionRule,
    result: ExecutionResult,
    fingerprint: string,
    occurrenceCount: number,
  ): Promise<Alert> {
    const now = new Date().toISOString();
    return {
      id: `alert-${fingerprint}-${Date.now()}`,
      tenantId: result.tenantId,
      ruleId: rule.id,
      ruleName: rule.name,
      ruleVersion: rule.version,
      title: rule.alertTitle,
      description: rule.alertDescription,
      severity: rule.severity,
      confidence: rule.confidence,
      mitreTactics: rule.mitreTactics,
      mitreTechniques: rule.mitreTechniques,
      triggeringEvents: result.eventIds,
      eventCount: result.hitCount,
      affectedAssetIds: [],
      status: 'OPEN',
      firstSeenAt: now,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
      fingerprint,
      occurrenceCount,
    };
  }
}
