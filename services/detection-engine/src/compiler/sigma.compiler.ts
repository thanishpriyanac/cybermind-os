/**
 * SigmaCompiler
 *
 * Translates a Sigma-compatible detection rule expression into an
 * Intermediate Query Model, then compiles that to OpenSearch DSL.
 *
 * Architecture:
 *   Sigma Expression (string)
 *         │
 *         ▼
 *   Sigma Parser  (parse())
 *         │
 *         ▼
 *   IntermediateQuery
 *         │
 *         ▼
 *   DSL Builder  (toOpenSearchDSL())
 *         │
 *         ▼
 *   OpenSearch Query DSL
 *
 * Sprint 13 covers the Sigma keyword/field detection syntax.
 * Future sprints can add aggregation conditions and near() proximity.
 */

export type ConditionOperator = 'AND' | 'OR' | 'NOT';

export interface IntermediateCondition {
  field?: string;       // specific field match (e.g. category: AUTHENTICATION)
  value: string | string[];
  operator: ConditionOperator;
  negate?: boolean;
}

export interface IntermediateQuery {
  conditions: IntermediateCondition[];
  additionalFilters?: {
    categories?: string[];
    severities?: string[];
    sources?: string[];
  };
  timeWindowMinutes?: number;
}

export interface CompiledRule {
  ruleId: string;
  intermediatQuery: IntermediateQuery;
  openSearchDsl: Record<string, any>;
}

export class SigmaCompiler {
  /**
   * Parse a Sigma-style YAML/JSON expression string into an IntermediateQuery.
   *
   * Supported expression format (JSON for sprint 13):
   * {
   *   "detection": {
   *     "condition": "keywords | all",        // "keywords | all" = AND, "keywords | any" = OR
   *     "keywords": ["LOGIN_FAILURE"],         // values matched against normalized_data.*
   *     "fields": {                            // optional field-specific matches
   *       "category": "AUTHENTICATION",
   *       "source": "syslog"
   *     },
   *     "not": ["SYSTEM", "SERVICE"]          // negated keywords
   *   },
   *   "filters": {
   *     "categories": ["AUTHENTICATION"],
   *     "severities": ["HIGH", "CRITICAL"]
   *   },
   *   "timeWindowMinutes": 60
   * }
   */
  parse(expression: string): IntermediateQuery {
    let parsed: any;
    try {
      parsed = JSON.parse(expression);
    } catch {
      throw new Error(`SigmaCompiler: expression must be valid JSON. Got: ${expression.slice(0, 80)}`);
    }

    const detection = parsed.detection;
    if (!detection) throw new Error('SigmaCompiler: missing "detection" block');

    const conditionStr: string = detection.condition ?? 'keywords | all';
    const useAnd = conditionStr.includes('all');

    const conditions: IntermediateCondition[] = [];

    // Keyword conditions (matched against query_string over normalized_data)
    if (Array.isArray(detection.keywords)) {
      for (const kw of detection.keywords) {
        conditions.push({ value: kw, operator: useAnd ? 'AND' : 'OR' });
      }
    }

    // Field-specific conditions
    if (detection.fields && typeof detection.fields === 'object') {
      for (const [field, val] of Object.entries(detection.fields)) {
        conditions.push({ field, value: val as string, operator: 'AND' });
      }
    }

    // Negated keywords
    if (Array.isArray(detection.not)) {
      for (const kw of detection.not) {
        conditions.push({ value: kw, operator: 'AND', negate: true });
      }
    }

    return {
      conditions,
      additionalFilters: parsed.filters,
      timeWindowMinutes: parsed.timeWindowMinutes,
    };
  }

  /**
   * Convert an IntermediateQuery to OpenSearch DSL filter structure.
   */
  toOpenSearchDSL(
    query: IntermediateQuery,
    tenantId: string,
    timeRange: { from: string; to: string },
  ): Record<string, any> {
    const must: any[] = [];
    const mustNot: any[] = [];
    const filter: any[] = [
      { term: { tenant_id: tenantId } },
      { range: { event_time: { gte: timeRange.from, lte: timeRange.to } } },
    ];

    for (const cond of query.conditions) {
      const clause = cond.field
        ? { term: { [cond.field]: cond.value } }
        : { query_string: { query: String(cond.value), default_field: 'normalized_data.*' } };

      if (cond.negate) {
        mustNot.push(clause);
      } else {
        must.push(clause);
      }
    }

    // Additional filters (category, severity, source)
    const f = query.additionalFilters;
    if (f?.categories?.length) filter.push({ terms: { category: f.categories } });
    if (f?.severities?.length) filter.push({ terms: { normalized_severity: f.severities } });
    if (f?.sources?.length) filter.push({ terms: { source: f.sources } });

    return {
      bool: {
        filter,
        ...(must.length ? { must } : {}),
        ...(mustNot.length ? { must_not: mustNot } : {}),
      },
    };
  }

  compile(ruleId: string, expression: string, tenantId: string, timeRange: { from: string; to: string }): CompiledRule {
    const intermediatQuery = this.parse(expression);
    const openSearchDsl = this.toOpenSearchDSL(intermediatQuery, tenantId, timeRange);
    return { ruleId, intermediatQuery, openSearchDsl };
  }
}
