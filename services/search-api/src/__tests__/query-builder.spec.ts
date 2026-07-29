import { QueryBuilder, SearchRequest } from '../domain/query-builder/query-builder';

describe('QueryBuilder', () => {
  let builder: QueryBuilder;

  const baseRequest: SearchRequest = {
    tenantId: 'tenant-alpha',
    timeRange: { from: '2026-07-01T00:00:00Z', to: '2026-07-28T23:59:59Z' },
  };

  beforeEach(() => {
    builder = new QueryBuilder();
  });

  it('should throw if tenantId is missing', () => {
    expect(() => builder.build({ ...baseRequest, tenantId: '' })).toThrow('tenantId is required');
  });

  it('should always include tenant_id filter', () => {
    const built = builder.build(baseRequest);
    const tenantFilter = built.query.bool.filter.find(
      (f: any) => f.term?.tenant_id === 'tenant-alpha'
    );
    expect(tenantFilter).toBeDefined();
  });

  it('should include event_time range filter', () => {
    const built = builder.build(baseRequest);
    const rangeFilter = built.query.bool.filter.find((f: any) => f.range?.event_time);
    expect(rangeFilter.range.event_time.gte).toBe(baseRequest.timeRange.from);
    expect(rangeFilter.range.event_time.lte).toBe(baseRequest.timeRange.to);
  });

  it('should add category terms filter when provided', () => {
    const built = builder.build({ ...baseRequest, categories: ['AUTHENTICATION', 'PROCESS'] });
    const catFilter = built.query.bool.filter.find((f: any) => f.terms?.category);
    expect(catFilter.terms.category).toEqual(['AUTHENTICATION', 'PROCESS']);
  });

  it('should add MITRE nested filter for tactics', () => {
    const built = builder.build({ ...baseRequest, mitreTactics: ['Execution'] });
    const mitreFilter = built.query.bool.filter.find((f: any) => f.nested?.path === 'mitre');
    expect(mitreFilter).toBeDefined();
    expect(mitreFilter.nested.query.terms['mitre.tactic']).toContain('Execution');
  });

  it('should add free-text query to must clause', () => {
    const built = builder.build({ ...baseRequest, query: 'powershell.exe' });
    expect(built.query.bool.must).toBeDefined();
    expect(built.query.bool.must[0].query_string.query).toBe('powershell.exe');
  });

  it('should reject a disallowed filter field', () => {
    expect(() =>
      builder.build({ ...baseRequest, filters: [{ field: 'raw_payload', value: 'exploit' }] })
    ).toThrow("field 'raw_payload' is not an allowed filter field");
  });

  it('should reject a disallowed sort field', () => {
    expect(() =>
      builder.build({ ...baseRequest, sort: [{ field: 'raw_payload', order: 'asc' }] })
    ).toThrow("field 'raw_payload' is not an allowed sort field");
  });

  it('should cap pageSize at 500', () => {
    const built = builder.build({ ...baseRequest, pageSize: 9999 });
    expect(built.size).toBe(500);
  });

  it('should default sort to event_time desc', () => {
    const built = builder.build(baseRequest);
    expect(built.sort[0]).toEqual({ event_time: { order: 'desc' } });
  });

  it('should include highlight configuration when highlight is true', () => {
    const built = builder.build({ ...baseRequest, highlight: true });
    expect(built.highlight).toBeDefined();
    expect(built.highlight!.pre_tags).toContain('<mark>');
  });

  it('should support prefix operator on allowed fields', () => {
    const built = builder.build({
      ...baseRequest,
      filters: [{ field: 'source', value: 'windows-', operator: 'prefix' }],
    });
    const prefixFilter = built.query.bool.filter.find((f: any) => f.prefix?.source);
    expect(prefixFilter).toBeDefined();
  });
});
