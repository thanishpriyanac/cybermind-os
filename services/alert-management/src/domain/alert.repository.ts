import { Alert, AlertStatus, AlertSeverity } from '../../../../packages/schemas/src/siem/alert';

export interface AlertUpdateParams {
  status?: AlertStatus;
  assigneeId?: string;
  closureNotes?: string;
  suppressedUntil?: string;
}

export interface AlertRepository {
  save(alert: Alert): Promise<Alert>;
  findById(tenantId: string, alertId: string): Promise<Alert | null>;
  update(tenantId: string, alertId: string, params: AlertUpdateParams): Promise<Alert>;
  listOpen(tenantId: string, limit?: number): Promise<Alert[]>;
  findByFingerprint(tenantId: string, fingerprint: string): Promise<Alert | null>;
}

/**
 * InMemoryAlertRepository – Release 1.0 store.
 * Sprint 15 will replace this with an OpenSearch-backed implementation.
 */
export class InMemoryAlertRepository implements AlertRepository {
  private readonly store = new Map<string, Alert>();

  private key(tenantId: string, alertId: string) {
    return `${tenantId}:${alertId}`;
  }

  async save(alert: Alert): Promise<Alert> {
    this.store.set(this.key(alert.tenantId, alert.id), alert);
    return alert;
  }

  async findById(tenantId: string, alertId: string): Promise<Alert | null> {
    return this.store.get(this.key(tenantId, alertId)) ?? null;
  }

  async update(tenantId: string, alertId: string, params: AlertUpdateParams): Promise<Alert> {
    const existing = await this.findById(tenantId, alertId);
    if (!existing) throw new Error(`Alert ${alertId} not found for tenant ${tenantId}`);
    const updated: Alert = {
      ...existing,
      ...params,
      updatedAt: new Date().toISOString(),
      ...(params.status === 'CLOSED' ? { closedAt: new Date().toISOString() } : {}),
    };
    this.store.set(this.key(tenantId, alertId), updated);
    return updated;
  }

  async listOpen(tenantId: string, limit = 100): Promise<Alert[]> {
    return [...this.store.values()]
      .filter(a => a.tenantId === tenantId && a.status === 'OPEN')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async findByFingerprint(tenantId: string, fingerprint: string): Promise<Alert | null> {
    return [...this.store.values()].find(
      a => a.tenantId === tenantId && a.fingerprint === fingerprint && a.status !== 'CLOSED'
    ) ?? null;
  }
}
