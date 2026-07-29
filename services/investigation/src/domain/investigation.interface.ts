export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
export type EvidenceType = 'EVENT' | 'ALERT' | 'ARTIFACT' | 'NOTE' | 'EXTERNAL_REF';

export interface InvestigationCase {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  status: CaseStatus;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeId?: string;
  tags: string[];
  relatedAlertIds: string[];
  relatedAssetIds: string[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface Evidence {
  id: string;
  caseId: string;
  tenantId: string;
  type: EvidenceType;
  title: string;
  content: string;       // event ID, alert ID, note text, or URL
  addedBy: string;       // analyst user ID
  addedAt: string;
}

export interface AnalystNote {
  id: string;
  caseId: string;
  tenantId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
