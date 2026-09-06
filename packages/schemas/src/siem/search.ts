export interface FieldFilter {
  field: string;
  value: string | string[] | boolean | number;
}

export interface TimeRange {
  from: string;
  to: string;
}

export interface SortField {
  field: string;
  order: 'asc' | 'desc';
}

export interface SavedSearch {
  id: string;
  tenantId: string;
  ownerId: string;
  name: string;
  description?: string;
  query?: string;
  filters?: FieldFilter[];
  timeRange?: TimeRange;
  categories?: string[];
  severities?: string[];
  sort?: SortField[];
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  eventId: string;
  eventTime: string;
  category: string;
  severity: string;
  source: string;
  summary: string;
  asset?: {
    id?: string;
    type?: string;
    environment?: string;
  };
  correlationId?: string;
  mitre?: { id: string; tactic: string }[];
  tenantId: string;
}
