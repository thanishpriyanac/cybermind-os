import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';
import { CompiledRule } from '../compiler/sigma.compiler';

const QUERY_TIMEOUT_MS = 30_000;
const MAX_RESULT_WINDOW = 1_000;

export interface ExecutionResult {
  ruleId: string;
  tenantId: string;
  hitCount: number;
  eventIds: string[];
  executionTimeMs: number;
}

@Injectable()
export class QueryExecutor {
  private readonly logger = new Logger(QueryExecutor.name);

  constructor(private readonly client: Client) {}

  async execute(compiled: CompiledRule, tenantId: string): Promise<ExecutionResult> {
    const start = Date.now();

    const { body } = await Promise.race([
      this.client.search({
        index: 'cybermind-events-read',
        body: {
          query: compiled.openSearchDsl,
          size: MAX_RESULT_WINDOW,
          _source: ['event_id', 'tenant_id', 'event_time', 'category', 'asset'],
          sort: [{ event_time: { order: 'desc' } }],
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Rule ${compiled.ruleId} query timed out`)), QUERY_TIMEOUT_MS)
      ),
    ]);

    const hits = body.hits.hits as any[];

    // Double-check tenant boundary (defense in depth)
    const safeHits = hits.filter(h => h._source?.tenant_id === tenantId);

    if (safeHits.length !== hits.length) {
      this.logger.warn(
        `Rule ${compiled.ruleId}: tenant_id mismatch detected — ${hits.length - safeHits.length} events filtered post-query`
      );
    }

    return {
      ruleId: compiled.ruleId,
      tenantId,
      hitCount: safeHits.length,
      eventIds: safeHits.map(h => h._source.event_id).filter(Boolean),
      executionTimeMs: Date.now() - start,
    };
  }
}
