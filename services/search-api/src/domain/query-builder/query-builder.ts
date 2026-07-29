/**
 * QueryBuilder
 *
 * Translates CYBERMIND search request parameters into OpenSearch DSL.
 * No caller outside this class should construct raw OpenSearch query objects.
 * This is the single place where query injection is prevented, field names
 * are validated, and query optimisations can be applied.
 */

// Fields that are allowed as sort/filter targets (allow-list)
const ALLOWED_FILTER_FIELDS = new Set([
  'event_id', 'tenant_id', 'source', 'category', 'normalized_severity',
  'correlation_id', 'asset.id', 'asset.type', 'asset.environment',
  'mitre.id', 'mitre.tactic', 'threat_intel.provider', 'threat_intel.ioc_type',
]);

const ALLOWED_SORT_FIELDS = new Set([
  'event_time', 'ingested_at', 'normalized_severity', 'confidence_score',
  'ingestion_latency_ms', 'source', 'category', 'tenant_id',
]);

export interface FieldFilter {
  field: string;
  value: string | string[] | boolean | number;
  operator?: 'eq' | 'in' | 'gte' | 'lte' | 'prefix' | 'wildcard';
}

export interface SearchRequest {
  tenantId: string;
  query?: string;
  filters?: FieldFilter[];
  timeRange: { from: string; to: string };
  categories?: string[];
  severities?: string[];
  sources?: string[];
  assetIds?: string[];
  mitreTactics?: string[];
  mitreTechniqueIds?: string[];
  correlationId?: string;
  page?: number;
  pageSize?: number;
  sort?: { field: string; order: 'asc' | 'desc' }[];
  highlight?: boolean;
}

export interface BuiltQuery {
  query: Record<string, any>;
  sort: Record<string, any>[];
  from: number;
  size: number;
  highlight?: Record<string, any>;
}

export class QueryBuilder {
  private readonly DEFAULT_PAGE_SIZE = 50;
  private readonly MAX_PAGE_SIZE = 500;

  build(request: SearchRequest): BuiltQuery {
    if (!request.tenantId?.trim()) {
      throw new Error('QueryBuilder: tenantId is required');
    }

    const filters: any[] = [
      { term: { tenant_id: request.tenantId } },
      { range: { event_time: { gte: request.timeRange.from, lte: request.timeRange.to } } },
    ];

    // Must clause (free-text query)
    const must: any[] = [];
    if (request.query) {
      must.push({ query_string: { query: request.query, default_operator: 'AND' } });
    }

    // Category / severity / source term filters
    for (const [field, values] of [
      ['category', request.categories],
      ['normalized_severity', request.severities],
      ['source', request.sources],
    ] as [string, string[] | undefined][]) {
      if (values?.length) {
        filters.push({ terms: { [field]: values } });
      }
    }

    // Asset filter
    if (request.assetIds?.length) {
      filters.push({ terms: { 'asset.id': request.assetIds } });
    }

    // MITRE filters (nested)
    if (request.mitreTactics?.length) {
      filters.push({
        nested: {
          path: 'mitre',
          query: { terms: { 'mitre.tactic': request.mitreTactics } },
        },
      });
    }
    if (request.mitreTechniqueIds?.length) {
      filters.push({
        nested: {
          path: 'mitre',
          query: { terms: { 'mitre.id': request.mitreTechniqueIds } },
        },
      });
    }

    // Correlation ID filter
    if (request.correlationId) {
      filters.push({ term: { correlation_id: request.correlationId } });
    }

    // Arbitrary field filters (validated against allow-list)
    if (request.filters?.length) {
      for (const f of request.filters) {
        if (!ALLOWED_FILTER_FIELDS.has(f.field)) {
          throw new Error(`QueryBuilder: field '${f.field}' is not an allowed filter field`);
        }
        const op = f.operator ?? 'eq';
        if (op === 'eq') filters.push({ term: { [f.field]: f.value } });
        else if (op === 'in') filters.push({ terms: { [f.field]: f.value } });
        else if (op === 'gte') filters.push({ range: { [f.field]: { gte: f.value } } });
        else if (op === 'lte') filters.push({ range: { [f.field]: { lte: f.value } } });
        else if (op === 'prefix') filters.push({ prefix: { [f.field]: f.value } });
        else if (op === 'wildcard') filters.push({ wildcard: { [f.field]: f.value } });
      }
    }

    // Sort (validated against allow-list)
    const sort = (request.sort ?? [{ field: 'event_time', order: 'desc' }]).map(s => {
      if (!ALLOWED_SORT_FIELDS.has(s.field)) {
        throw new Error(`QueryBuilder: field '${s.field}' is not an allowed sort field`);
      }
      return { [s.field]: { order: s.order } };
    });

    // Pagination
    const pageSize = Math.min(request.pageSize ?? this.DEFAULT_PAGE_SIZE, this.MAX_PAGE_SIZE);
    const page = Math.max(request.page ?? 1, 1);

    const built: BuiltQuery = {
      query: { bool: { filter: filters, must: must.length ? must : undefined } },
      sort,
      from: (page - 1) * pageSize,
      size: pageSize,
    };

    // Highlighting (opt-in)
    if (request.highlight) {
      built.highlight = {
        fields: {
          'normalized_data.*': {},
          query: {},
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      };
    }

    return built;
  }
}
