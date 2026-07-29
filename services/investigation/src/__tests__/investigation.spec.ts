import { InvestigationService } from '../domain/investigation.service';

describe('InvestigationService', () => {
  let service: InvestigationService;

  beforeEach(() => { service = new InvestigationService(); });

  it('should create a case with OPEN status', async () => {
    const c = await service.createCase('tenant-alpha', {
      title: 'Test Case', description: 'Testing', severity: 'HIGH',
      tags: [], relatedAlertIds: [], relatedAssetIds: [],
    });
    expect(c.status).toBe('OPEN');
    expect(c.tenantId).toBe('tenant-alpha');
  });

  it('should transition OPEN → IN_PROGRESS on assign', async () => {
    const c = await service.createCase('tenant-alpha', {
      title: 'Test', description: '', severity: 'MEDIUM',
      tags: [], relatedAlertIds: [], relatedAssetIds: [],
    });
    const updated = await service.assignCase('tenant-alpha', c.id, 'analyst-007');
    expect(updated.status).toBe('IN_PROGRESS');
    expect(updated.assigneeId).toBe('analyst-007');
  });

  it('should close a case from IN_PROGRESS', async () => {
    const c = await service.createCase('tenant-alpha', {
      title: 'Test', description: '', severity: 'HIGH',
      tags: [], relatedAlertIds: [], relatedAssetIds: [],
    });
    await service.assignCase('tenant-alpha', c.id, 'analyst-007');
    const closed = await service.transitionStatus('tenant-alpha', c.id, 'CLOSED');
    expect(closed.status).toBe('CLOSED');
    expect(closed.closedAt).toBeDefined();
  });

  it('should reject direct OPEN → CLOSED transition', async () => {
    const c = await service.createCase('tenant-alpha', {
      title: 'Test', description: '', severity: 'LOW',
      tags: [], relatedAlertIds: [], relatedAssetIds: [],
    });
    await expect(
      service.transitionStatus('tenant-alpha', c.id, 'CLOSED')
    ).rejects.toThrow('Invalid transition');
  });

  it('should add and list evidence', async () => {
    const c = await service.createCase('tenant-alpha', {
      title: 'Test', description: '', severity: 'HIGH',
      tags: [], relatedAlertIds: [], relatedAssetIds: [],
    });
    await service.addEvidence('tenant-alpha', c.id, {
      type: 'EVENT', title: 'Auth Failure', content: 'evt-001', addedBy: 'analyst-007',
    });
    const evidence = await service.listEvidence('tenant-alpha', c.id);
    expect(evidence).toHaveLength(1);
    expect(evidence[0].content).toBe('evt-001');
  });

  it('should add and list analyst notes', async () => {
    const c = await service.createCase('tenant-alpha', {
      title: 'Test', description: '', severity: 'MEDIUM',
      tags: [], relatedAlertIds: [], relatedAssetIds: [],
    });
    await service.addNote('tenant-alpha', c.id, 'analyst-007', 'Reviewing syslog events.');
    const notes = await service.listNotes('tenant-alpha', c.id);
    expect(notes).toHaveLength(1);
    expect(notes[0].content).toBe('Reviewing syslog events.');
  });

  it('should not find a case from another tenant', async () => {
    const c = await service.createCase('tenant-beta', {
      title: 'Test', description: '', severity: 'LOW',
      tags: [], relatedAlertIds: [], relatedAssetIds: [],
    });
    await expect(service.getCase('tenant-alpha', c.id)).rejects.toThrow('not found');
  });
});
