import { AlertManagementService } from '../domain/alert-management.service';
import { InMemoryAlertRepository } from '../domain/alert.repository';
import { Alert } from '../../../../packages/schemas/src/siem/alert';

const buildAlert = (overrides?: Partial<Alert>): Alert => ({
  id: 'alert-001',
  tenantId: 'tenant-alpha',
  ruleId: 'rule-001',
  ruleName: 'Test Rule',
  ruleVersion: '1.0.0',
  title: 'Test Alert',
  description: 'Test',
  severity: 'HIGH',
  confidence: 80,
  mitreTactics: [],
  mitreTechniques: [],
  triggeringEvents: ['evt-1'],
  eventCount: 1,
  affectedAssetIds: [],
  status: 'OPEN',
  firstSeenAt: new Date().toISOString(),
  lastSeenAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  fingerprint: 'fp-abc123',
  occurrenceCount: 1,
  ...overrides,
});

describe('AlertManagementService', () => {
  let service: AlertManagementService;
  let repo: InMemoryAlertRepository;

  beforeEach(() => {
    repo = new InMemoryAlertRepository();
    service = new AlertManagementService(repo);
  });

  it('should ingest an alert', async () => {
    const alert = await service.ingest(buildAlert());
    expect(alert.id).toBe('alert-001');
    expect(alert.status).toBe('OPEN');
  });

  it('should assign an analyst to an alert', async () => {
    await service.ingest(buildAlert());
    const updated = await service.assignAlert('tenant-alpha', 'alert-001', 'analyst-007');
    expect(updated.assigneeId).toBe('analyst-007');
    expect(updated.status).toBe('IN_PROGRESS');
  });

  it('should close an alert with valid transition', async () => {
    await service.ingest(buildAlert());
    await service.assignAlert('tenant-alpha', 'alert-001', 'analyst-007');
    const closed = await service.transitionStatus('tenant-alpha', 'alert-001', 'CLOSED', 'False positive');
    expect(closed.status).toBe('CLOSED');
    expect(closed.closureNotes).toBe('False positive');
    expect(closed.closedAt).toBeDefined();
  });

  it('should reject an invalid state transition', async () => {
    await service.ingest(buildAlert());
    await expect(
      service.transitionStatus('tenant-alpha', 'alert-001', 'CLOSED')
    ).rejects.toThrow('Invalid transition: OPEN → CLOSED');
  });

  it('should suppress an alert with a future date', async () => {
    await service.ingest(buildAlert());
    const suppressed = await service.suppressAlert('tenant-alpha', 'alert-001', '2099-01-01T00:00:00Z');
    expect(suppressed.status).toBe('SUPPRESSED');
    expect(suppressed.suppressedUntil).toBe('2099-01-01T00:00:00Z');
  });

  it('should deduplicate alert with the same fingerprint', async () => {
    await service.ingest(buildAlert({ id: 'alert-001', fingerprint: 'fp-same' }));
    const result = await service.ingest(buildAlert({ id: 'alert-002', fingerprint: 'fp-same' }));
    // Should return the existing alert, not create a duplicate
    expect(result.id).toBe('alert-001');
  });

  it('should not find an alert belonging to another tenant', async () => {
    await service.ingest(buildAlert({ tenantId: 'tenant-beta' }));
    await expect(service.getAlert('tenant-alpha', 'alert-001')).rejects.toThrow('not found');
  });
});
