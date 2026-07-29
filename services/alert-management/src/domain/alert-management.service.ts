import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Alert, AlertStatus } from '../../../../packages/schemas/src/siem/alert';
import { AlertRepository, AlertUpdateParams } from './alert.repository';

@Injectable()
export class AlertManagementService {
  private readonly logger = new Logger(AlertManagementService.name);

  // Valid state transitions
  private readonly TRANSITIONS: Partial<Record<AlertStatus, AlertStatus[]>> = {
    OPEN:        ['IN_PROGRESS', 'CLOSED', 'SUPPRESSED'],
    IN_PROGRESS: ['CLOSED', 'OPEN', 'SUPPRESSED'],
    SUPPRESSED:  ['OPEN'],
    CLOSED:      [], // terminal state
  };

  constructor(private readonly alertRepository: AlertRepository) {}

  async ingest(alert: Alert): Promise<Alert> {
    // Deduplication: if an open alert with same fingerprint exists, increment count
    const existing = await this.alertRepository.findByFingerprint(alert.tenantId, alert.fingerprint);
    if (existing && existing.status !== 'CLOSED') {
      return this.alertRepository.update(alert.tenantId, existing.id, {
        status: existing.status,
      });
    }
    const saved = await this.alertRepository.save(alert);
    this.logger.log(`Alert ingested: ${saved.id} [${saved.severity}] for tenant ${saved.tenantId}`);
    return saved;
  }

  async assignAlert(tenantId: string, alertId: string, assigneeId: string): Promise<Alert> {
    const alert = await this.requireAlert(tenantId, alertId);
    if (alert.status === 'CLOSED') {
      throw new BadRequestException(`Alert ${alertId} is closed and cannot be assigned`);
    }
    return this.alertRepository.update(tenantId, alertId, {
      status: 'IN_PROGRESS',
      assigneeId,
    });
  }

  async transitionStatus(
    tenantId: string,
    alertId: string,
    newStatus: AlertStatus,
    closureNotes?: string,
  ): Promise<Alert> {
    const alert = await this.requireAlert(tenantId, alertId);
    const allowed = this.TRANSITIONS[alert.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid transition: ${alert.status} → ${newStatus}`
      );
    }
    const params: AlertUpdateParams = { status: newStatus };
    if (newStatus === 'CLOSED') params.closureNotes = closureNotes ?? '';
    return this.alertRepository.update(tenantId, alertId, params);
  }

  async suppressAlert(tenantId: string, alertId: string, suppressedUntil: string): Promise<Alert> {
    await this.requireAlert(tenantId, alertId);
    return this.alertRepository.update(tenantId, alertId, {
      status: 'SUPPRESSED',
      suppressedUntil,
    });
  }

  async listOpenAlerts(tenantId: string): Promise<Alert[]> {
    return this.alertRepository.listOpen(tenantId);
  }

  async getAlert(tenantId: string, alertId: string): Promise<Alert> {
    return this.requireAlert(tenantId, alertId);
  }

  private async requireAlert(tenantId: string, alertId: string): Promise<Alert> {
    const alert = await this.alertRepository.findById(tenantId, alertId);
    if (!alert) throw new NotFoundException(`Alert ${alertId} not found`);
    return alert;
  }
}
