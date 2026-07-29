import { DetectionRule } from '../../../../packages/schemas/src/siem/detection-rule';

export interface InMemoryRuleStore {
  [ruleId: string]: DetectionRule;
}

export interface RuleRepository {
  listActive(tenantId?: string): Promise<DetectionRule[]>;
  getById(ruleId: string): Promise<DetectionRule | null>;
  save(rule: DetectionRule): Promise<DetectionRule>;
  update(ruleId: string, updates: Partial<DetectionRule>): Promise<DetectionRule>;
  disable(ruleId: string): Promise<void>;
}

/**
 * InMemoryRuleRepository – Release 1.0 backing store.
 *
 * Seeded with platform-level GLOBAL rules at startup.
 * In a future sprint this will be backed by PostgreSQL via Prisma.
 */
export class InMemoryRuleRepository implements RuleRepository {
  private readonly store: InMemoryRuleStore = {};

  async listActive(tenantId?: string): Promise<DetectionRule[]> {
    return Object.values(this.store).filter(
      r =>
        r.enabled &&
        r.status === 'ACTIVE' &&
        (r.tenantId === 'GLOBAL' || !tenantId || r.tenantId === tenantId)
    );
  }

  async getById(ruleId: string): Promise<DetectionRule | null> {
    return this.store[ruleId] ?? null;
  }

  async save(rule: DetectionRule): Promise<DetectionRule> {
    this.store[rule.id] = rule;
    return rule;
  }

  async update(ruleId: string, updates: Partial<DetectionRule>): Promise<DetectionRule> {
    const existing = this.store[ruleId];
    if (!existing) throw new Error(`Rule ${ruleId} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.store[ruleId] = updated;
    return updated;
  }

  async disable(ruleId: string): Promise<void> {
    if (this.store[ruleId]) {
      this.store[ruleId].enabled = false;
      this.store[ruleId].status = 'DISABLED';
    }
  }
}
