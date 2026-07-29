import { Injectable, Logger } from '@nestjs/common';
import { CorrelationRule, CorrelationSession } from '../domain/correlation-rule.interface';
import { EnrichedEvent } from '../../../../packages/schemas/src/normalization/enriched-event';
import { Alert } from '../../../../packages/schemas/src/siem/alert';
import * as crypto from 'crypto';

/**
 * CorrelationEngine
 *
 * Processes a stream of enriched events against correlation rules.
 * Maintains in-memory sliding sessions grouped by rule + entity key.
 * Produces alerts when conditions (COUNT threshold or SEQUENCE) are met.
 *
 * Examples:
 *   - 5+ LOGIN_FAILURE events on the same asset within 5 minutes → Brute Force
 *   - PROCESS_CREATED then CONNECTION_ALLOWED within 2 minutes → Lateral Movement
 */

const SESSION_CLEANUP_INTERVAL_MS = 60_000;

@Injectable()
export class CorrelationEngine {
  private readonly logger = new Logger(CorrelationEngine.name);

  // sessionKey = `${ruleId}:${groupKey}` → session
  private readonly sessions = new Map<string, CorrelationSession>();
  private readonly rules: CorrelationRule[] = [];

  constructor() {
    // Session expiry cleanup
    setInterval(() => this.cleanExpiredSessions(), SESSION_CLEANUP_INTERVAL_MS);
  }

  registerRule(rule: CorrelationRule) {
    this.rules.push(rule);
    this.logger.log(`Correlation rule registered: ${rule.name}`);
  }

  async processEvent(event: EnrichedEvent): Promise<Alert[]> {
    const triggered: Alert[] = [];

    for (const rule of this.rules) {
      if (!this.eventMatchesRule(event, rule)) continue;

      const groupKey = this.buildGroupKey(event, rule.conditions.groupBy);
      const sessionKey = `${rule.id}:${groupKey}`;

      let session = this.sessions.get(sessionKey);

      if (!session) {
        const now = new Date();
        session = {
          sessionId: crypto.randomUUID(),
          tenantId: event.canonicalEvent.tenantId,
          ruleId: rule.id,
          groupKey,
          events: [],
          openedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + rule.conditions.windowMinutes * 60_000).toISOString(),
        };
        this.sessions.set(sessionKey, session);
      }

      // Append event to session
      session.events.push({
        eventId: event.canonicalEvent.eventId,
        eventTime: event.canonicalEvent.eventTime,
        action: event.canonicalEvent.normalizedData?.action,
      });

      // Evaluate condition
      const alert = this.evaluate(rule, session, event);
      if (alert) {
        triggered.push(alert);
        this.sessions.delete(sessionKey); // reset session after match
      }
    }

    return triggered;
  }

  private eventMatchesRule(event: EnrichedEvent, rule: CorrelationRule): boolean {
    const { categories, actions, sources } = rule.eventFilters;
    const category = event.canonicalEvent.category;
    const action = event.canonicalEvent.normalizedData?.action;
    const source = event.canonicalEvent.source;

    if (categories?.length && !categories.includes(category)) return false;
    if (actions?.length && action && !actions.includes(action)) return false;
    if (sources?.length && !sources.includes(source)) return false;
    return true;
  }

  private buildGroupKey(event: EnrichedEvent, groupBy: string[]): string {
    return groupBy.map(field => {
      if (field === 'asset.id') return event.asset?.id ?? 'UNKNOWN';
      if (field === 'tenant_id') return event.canonicalEvent.tenantId;
      if (field === 'source') return event.canonicalEvent.source;
      return 'UNKNOWN';
    }).join(':');
  }

  private evaluate(rule: CorrelationRule, session: CorrelationSession, lastEvent: EnrichedEvent): Alert | null {
    const { type, threshold, sequence } = rule.conditions;

    if (type === 'COUNT' || type === 'THRESHOLD') {
      if (session.events.length >= (threshold ?? 5)) {
        return this.buildAlert(rule, session, lastEvent);
      }
    }

    if (type === 'SEQUENCE' && sequence?.length) {
      const observedActions = session.events.map(e => e.action);
      // Check if all sequence steps appear in order
      let idx = 0;
      for (const action of observedActions) {
        if (action === sequence[idx]) idx++;
        if (idx === sequence.length) return this.buildAlert(rule, session, lastEvent);
      }
    }

    return null;
  }

  private buildAlert(rule: CorrelationRule, session: CorrelationSession, lastEvent: EnrichedEvent): Alert {
    const now = new Date().toISOString();
    return {
      id: `corr-alert-${crypto.randomUUID()}`,
      tenantId: session.tenantId,
      ruleId: rule.id,
      ruleName: rule.name,
      ruleVersion: '1.0.0',
      title: rule.alertTitle,
      description: rule.description,
      severity: rule.severity,
      confidence: rule.confidence,
      mitreTactics: rule.mitreTactics,
      mitreTechniques: [],
      triggeringEvents: session.events.map(e => e.eventId),
      eventCount: session.events.length,
      affectedAssetIds: lastEvent.asset?.id ? [lastEvent.asset.id] : [],
      status: 'OPEN',
      firstSeenAt: session.openedAt,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
      fingerprint: crypto.createHash('sha256')
        .update(`${rule.id}:${session.groupKey}`)
        .digest('hex').slice(0, 16),
      occurrenceCount: 1,
    };
  }

  private cleanExpiredSessions() {
    const now = new Date();
    let removed = 0;
    for (const [key, session] of this.sessions.entries()) {
      if (new Date(session.expiresAt) < now) {
        this.sessions.delete(key);
        removed++;
      }
    }
    if (removed > 0) this.logger.debug(`Cleaned ${removed} expired correlation sessions`);
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}
