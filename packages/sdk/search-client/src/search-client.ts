import { Client } from '@opensearch-project/opensearch';
import { EnrichedEvent } from '../../../../packages/schemas/src/normalization/enriched-event';
import { Alert } from '../../../../packages/schemas/src/siem/alert';

// ─── Parameter Types ────────────────────────────────────────────────────────

export interface FieldFilter {
  field: string;
  value: string | string[] | boolean | number;
}

export interface TimeRange {
  from: string; // ISO 8601
  to: string;
}

export interface SortField {
  field: string;
  order: 'asc' | 'desc';
}

export interface EventSearchParams {
  tenantId: string;             // Required — always scoped
  query?: string;               // Free text search
  filters?: FieldFilter[];
  timeRange: TimeRange;
  categories?: string[];
  severities?: string[];
  sources?: string[];
  assetIds?: string[];
  mitreTactics?: string[];
  mitreTechniqueIds?: string[];
  page?: number;
  pageSize?: number;            // Default 50, max 500
  sort?: SortField[];
}

export interface AggregateParams {
  tenantId: string;
  timeRange: TimeRange;
  groupBy: string[];
  interval?: string;            // e.g., '1h', '1d'
  metric?: 'count' | 'avg' | 'sum';
  metricField?: string;
}

export interface TimelineParams {
  tenantId: string;
  timeRange: TimeRange;
  assetId?: string;
  correlationId?: string;
  pageSize?: number;
}

export interface ScrollParams {
  tenantId: string;
  timeRange: TimeRange;
  scrollId?: string;
  pageSize?: number;
}

// ─── Result Types ────────────────────────────────────────────────────────────

export interface SearchResult<T> {
  hits: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AggregateResult {
  buckets: Array<{ key: string; count: number; [metric: string]: any }>;
  total: number;
}

export interface TimelineResult {
  events: EnrichedEvent[];
  total: number;
}

export interface ScrollResult<T> {
  hits: T[];
  scrollId: string;
  hasMore: boolean;
}

// ─── Client ──────────────────────────────────────────────────────────────────

export class CybermindSearchClient {
  constructor(private readonly client: Client) {}

  private requireTenantId(tenantId: string) {
    if (!tenantId || tenantId.trim() === '') {
      throw new Error('CybermindSearchClient: tenantId is required on all queries');
    }
  }

  private buildBaseQuery(tenantId: string, timeRange: TimeRange) {
    return {
      bool: {
        filter: [
          { term: { tenant_id: tenantId } },
          { range: { event_time: { gte: timeRange.from, lte: timeRange.to } } },
        ],
      },
    };
  }

  async searchEvents(params: EventSearchParams): Promise<SearchResult<EnrichedEvent>> {
    this.requireTenantId(params.tenantId);
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 50, 500);

    const query: any = this.buildBaseQuery(params.tenantId, params.timeRange);

    // Free text
    if (params.query) {
      query.bool.must = [{ query_string: { query: params.query } }];
    }

    // Category/severity/source filters
    for (const [field, values] of [
      ['category', params.categories],
      ['normalized_severity', params.severities],
      ['source', params.sources],
    ] as [string, string[] | undefined][]) {
      if (values?.length) {
        query.bool.filter.push({ terms: { [field]: values } });
      }
    }

    if (params.assetIds?.length) {
      query.bool.filter.push({ terms: { 'asset.id': params.assetIds } });
    }

    if (params.mitreTactics?.length) {
      query.bool.filter.push({
        nested: { path: 'mitre', query: { terms: { 'mitre.tactic': params.mitreTactics } } },
      });
    }

    if (params.filters?.length) {
      for (const f of params.filters) {
        query.bool.filter.push({ term: { [f.field]: f.value } });
      }
    }

    const sort = params.sort?.map(s => ({ [s.field]: { order: s.order } })) ?? [
      { event_time: { order: 'desc' } },
    ];

    const { body } = await this.client.search({
      index: 'cybermind-events-read',
      body: {
        query,
        sort,
        from: (page - 1) * pageSize,
        size: pageSize,
      },
    });

    return {
      hits: body.hits.hits.map((h: any) => h._source as EnrichedEvent),
      total: body.hits.total?.value ?? 0,
      page,
      pageSize,
    };
  }

  async searchByEventId(tenantId: string, eventId: string): Promise<EnrichedEvent | null> {
    this.requireTenantId(tenantId);
    const { body } = await this.client.get({
      index: 'cybermind-events-read',
      id: eventId,
    });
    const doc = body._source as any;
    if (!doc || doc.tenant_id !== tenantId) return null;
    return doc as EnrichedEvent;
  }

  async searchByCorrelationId(tenantId: string, correlationId: string, timeRange: TimeRange): Promise<EnrichedEvent[]> {
    this.requireTenantId(tenantId);
    const query = this.buildBaseQuery(tenantId, timeRange) as any;
    query.bool.filter.push({ term: { correlation_id: correlationId } });
    const { body } = await this.client.search({
      index: 'cybermind-events-read',
      body: { query, sort: [{ event_time: { order: 'asc' } }], size: 1000 },
    });
    return body.hits.hits.map((h: any) => h._source as EnrichedEvent);
  }

  async aggregate(params: AggregateParams): Promise<AggregateResult> {
    this.requireTenantId(params.tenantId);
    const query = this.buildBaseQuery(params.tenantId, params.timeRange);
    const aggs: any = {};

    for (const field of params.groupBy) {
      aggs[`by_${field}`] = { terms: { field, size: 100 } };
    }

    if (params.interval) {
      aggs.over_time = {
        date_histogram: { field: 'event_time', calendar_interval: params.interval },
      };
    }

    const { body } = await this.client.search({
      index: 'cybermind-events-read',
      body: { query, aggs, size: 0 },
    });

    const firstAggKey = Object.keys(body.aggregations ?? {})[0];
    const buckets = body.aggregations?.[firstAggKey]?.buckets ?? [];

    return {
      buckets: buckets.map((b: any) => ({ key: b.key_as_string ?? b.key, count: b.doc_count })),
      total: body.hits.total?.value ?? 0,
    };
  }

  async timeline(params: TimelineParams): Promise<TimelineResult> {
    this.requireTenantId(params.tenantId);
    const query = this.buildBaseQuery(params.tenantId, params.timeRange) as any;
    if (params.assetId) query.bool.filter.push({ term: { 'asset.id': params.assetId } });
    if (params.correlationId) query.bool.filter.push({ term: { correlation_id: params.correlationId } });

    const { body } = await this.client.search({
      index: 'cybermind-events-read',
      body: {
        query,
        sort: [{ event_time: { order: 'asc' } }],
        size: params.pageSize ?? 200,
      },
    });

    return {
      events: body.hits.hits.map((h: any) => h._source as EnrichedEvent),
      total: body.hits.total?.value ?? 0,
    };
  }

  async count(tenantId: string, filters: FieldFilter[], timeRange: TimeRange): Promise<number> {
    this.requireTenantId(tenantId);
    const query = this.buildBaseQuery(tenantId, timeRange) as any;
    for (const f of filters) query.bool.filter.push({ term: { [f.field]: f.value } });
    const { body } = await this.client.count({ index: 'cybermind-events-read', body: { query } });
    return body.count;
  }

  async searchAlerts(params: EventSearchParams): Promise<SearchResult<Alert>> {
    this.requireTenantId(params.tenantId);
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 50, 500);
    const query = this.buildBaseQuery(params.tenantId, params.timeRange);
    const { body } = await this.client.search({
      index: 'cybermind-alerts-read',
      body: { query, from: (page - 1) * pageSize, size: pageSize },
    });
    return {
      hits: body.hits.hits.map((h: any) => h._source as Alert),
      total: body.hits.total?.value ?? 0,
      page,
      pageSize,
    };
  }
}
