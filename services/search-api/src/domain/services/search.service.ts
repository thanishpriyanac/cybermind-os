import { Injectable, Logger } from '@nestjs/common';
import {
  CybermindSearchClient,
  EventSearchParams,
  AggregateParams,
  TimelineParams,
  SearchResult,
  AggregateResult,
  TimelineResult,
} from '../../../../../packages/sdk/search-client/src/search-client';
import { Alert } from '../../../../../packages/schemas/src/siem/alert';
import { EnrichedEvent } from '../../../../../packages/schemas/src/normalization/enriched-event';
import { TimelineEvent } from '../../../../../packages/schemas/src/siem/search';
import { QueryBuilder, SearchRequest } from '../query-builder/query-builder';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly searchClient: CybermindSearchClient,
    private readonly queryBuilder: QueryBuilder,
  ) {}

  async searchEvents(request: SearchRequest): Promise<SearchResult<EnrichedEvent>> {
    // Validate and build DSL (throws on invalid field or missing tenantId)
    this.queryBuilder.build(request);

    const params: EventSearchParams = {
      tenantId: request.tenantId,
      query: request.query,
      filters: request.filters,
      timeRange: request.timeRange,
      categories: request.categories,
      severities: request.severities,
      sources: request.sources,
      assetIds: request.assetIds,
      mitreTactics: request.mitreTactics,
      page: request.page,
      pageSize: request.pageSize,
      sort: request.sort,
    };

    this.logger.debug(`searchEvents tenant=${request.tenantId} query="${request.query ?? ''}"`);
    return this.searchClient.searchEvents(params);
  }

  async searchAlerts(request: SearchRequest): Promise<SearchResult<Alert>> {
    this.queryBuilder.build(request);
    const params: EventSearchParams = {
      tenantId: request.tenantId,
      query: request.query,
      filters: request.filters,
      timeRange: request.timeRange,
      severities: request.severities,
      page: request.page,
      pageSize: request.pageSize,
    };
    return this.searchClient.searchAlerts(params);
  }

  async aggregate(params: AggregateParams): Promise<AggregateResult> {
    if (!params.tenantId?.trim()) throw new Error('tenantId required');
    return this.searchClient.aggregate(params);
  }

  async timeline(tenantId: string, params: TimelineParams): Promise<TimelineEvent[]> {
    if (!tenantId?.trim()) throw new Error('tenantId required');
    const result = await this.searchClient.timeline(params);

    // Map EnrichedEvent → TimelineEvent (stable contract for UI consumers)
    return result.events.map(e => ({
      eventId: e.canonicalEvent.eventId,
      eventTime: e.canonicalEvent.eventTime,
      category: e.canonicalEvent.category,
      severity: e.normalizedSeverity,
      source: e.canonicalEvent.source,
      summary: this.buildSummary(e),
      asset: e.asset
        ? { id: e.asset.id, type: e.asset.type, environment: e.asset.environment }
        : undefined,
      correlationId: e.canonicalEvent.correlationId,
      mitre: e.mitre?.map(m => ({ id: m.id, tactic: m.tactic })),
      tenantId: e.canonicalEvent.tenantId,
    }));
  }

  private buildSummary(event: EnrichedEvent): string {
    const action = event.canonicalEvent.normalizedData?.action;
    const category = event.canonicalEvent.category;
    const source = event.canonicalEvent.source;
    if (action) return `${category}: ${action} from ${source}`;
    return `${category} event from ${source}`;
  }
}
