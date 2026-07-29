import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InvestigationCase, Evidence, AnalystNote, CaseStatus } from './investigation.interface';
import * as crypto from 'crypto';

@Injectable()
export class InvestigationService {
  private readonly cases = new Map<string, InvestigationCase>();
  private readonly evidence = new Map<string, Evidence[]>();
  private readonly notes = new Map<string, AnalystNote[]>();

  private readonly TRANSITIONS: Partial<Record<CaseStatus, CaseStatus[]>> = {
    OPEN: ['IN_PROGRESS', 'CLOSED'],
    IN_PROGRESS: ['CLOSED', 'OPEN'],
    CLOSED: [],
  };

  // ── Cases ──────────────────────────────────────────────────────────────────

  async createCase(
    tenantId: string,
    params: Pick<InvestigationCase, 'title' | 'description' | 'severity' | 'tags' | 'relatedAlertIds' | 'relatedAssetIds'>,
  ): Promise<InvestigationCase> {
    const now = new Date().toISOString();
    const newCase: InvestigationCase = {
      id: crypto.randomUUID(),
      tenantId,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
      ...params,
    };
    this.cases.set(this.caseKey(tenantId, newCase.id), newCase);
    this.evidence.set(newCase.id, []);
    this.notes.set(newCase.id, []);
    return newCase;
  }

  async getCase(tenantId: string, caseId: string): Promise<InvestigationCase> {
    return this.requireCase(tenantId, caseId);
  }

  async listCases(tenantId: string): Promise<InvestigationCase[]> {
    return [...this.cases.values()]
      .filter(c => c.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async assignCase(tenantId: string, caseId: string, assigneeId: string): Promise<InvestigationCase> {
    const c = await this.requireCase(tenantId, caseId);
    const updated = { ...c, assigneeId, status: 'IN_PROGRESS' as CaseStatus, updatedAt: new Date().toISOString() };
    this.cases.set(this.caseKey(tenantId, caseId), updated);
    return updated;
  }

  async transitionStatus(tenantId: string, caseId: string, newStatus: CaseStatus): Promise<InvestigationCase> {
    const c = await this.requireCase(tenantId, caseId);
    const allowed = this.TRANSITIONS[c.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Invalid transition: ${c.status} → ${newStatus}`);
    }
    const updated: InvestigationCase = {
      ...c,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      ...(newStatus === 'CLOSED' ? { closedAt: new Date().toISOString() } : {}),
    };
    this.cases.set(this.caseKey(tenantId, caseId), updated);
    return updated;
  }

  // ── Evidence ───────────────────────────────────────────────────────────────

  async addEvidence(tenantId: string, caseId: string, params: Pick<Evidence, 'type' | 'title' | 'content' | 'addedBy'>): Promise<Evidence> {
    await this.requireCase(tenantId, caseId);
    const ev: Evidence = {
      id: crypto.randomUUID(),
      caseId,
      tenantId,
      addedAt: new Date().toISOString(),
      ...params,
    };
    const list = this.evidence.get(caseId) ?? [];
    list.push(ev);
    this.evidence.set(caseId, list);
    return ev;
  }

  async listEvidence(tenantId: string, caseId: string): Promise<Evidence[]> {
    await this.requireCase(tenantId, caseId);
    return this.evidence.get(caseId) ?? [];
  }

  // ── Notes ──────────────────────────────────────────────────────────────────

  async addNote(tenantId: string, caseId: string, authorId: string, content: string): Promise<AnalystNote> {
    await this.requireCase(tenantId, caseId);
    const now = new Date().toISOString();
    const note: AnalystNote = {
      id: crypto.randomUUID(),
      caseId,
      tenantId,
      authorId,
      content,
      createdAt: now,
      updatedAt: now,
    };
    const list = this.notes.get(caseId) ?? [];
    list.push(note);
    this.notes.set(caseId, list);
    return note;
  }

  async listNotes(tenantId: string, caseId: string): Promise<AnalystNote[]> {
    await this.requireCase(tenantId, caseId);
    return this.notes.get(caseId) ?? [];
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private caseKey(tenantId: string, caseId: string) {
    return `${tenantId}:${caseId}`;
  }

  private async requireCase(tenantId: string, caseId: string): Promise<InvestigationCase> {
    const c = this.cases.get(this.caseKey(tenantId, caseId));
    if (!c) throw new NotFoundException(`Case ${caseId} not found`);
    return c;
  }
}
