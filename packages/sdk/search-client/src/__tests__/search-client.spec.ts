import { CybermindSearchClient, EventSearchParams } from '../search-client';
import { Client } from '@opensearch-project/opensearch';

describe('CybermindSearchClient', () => {
  const mockSearch = jest.fn();
  const mockCount = jest.fn();
  const mockGet = jest.fn();

  const mockClient = {
    search: mockSearch,
    count: mockCount,
    get: mockGet,
  } as unknown as Client;

  let searchClient: CybermindSearchClient;

  beforeEach(() => {
    searchClient = new CybermindSearchClient(mockClient);
    jest.clearAllMocks();
  });

  const baseParams: EventSearchParams = {
    tenantId: 'tenant-alpha',
    timeRange: { from: '2026-07-01T00:00:00Z', to: '2026-07-28T23:59:59Z' },
  };

  it('should throw if tenantId is missing', async () => {
    await expect(
      searchClient.searchEvents({ ...baseParams, tenantId: '' })
    ).rejects.toThrow('tenantId is required');
  });

  it('should always include tenant_id filter in every query', async () => {
    mockSearch.mockResolvedValueOnce({
      body: { hits: { hits: [], total: { value: 0 } } },
    });
    await searchClient.searchEvents(baseParams);
    const body = mockSearch.mock.calls[0][0].body;
    const tenantFilter = body.query.bool.filter.find(
      (f: any) => f.term?.tenant_id === 'tenant-alpha'
    );
    expect(tenantFilter).toBeDefined();
  });

  it('should apply time range filter', async () => {
    mockSearch.mockResolvedValueOnce({
      body: { hits: { hits: [], total: { value: 0 } } },
    });
    await searchClient.searchEvents(baseParams);
    const body = mockSearch.mock.calls[0][0].body;
    const rangeFilter = body.query.bool.filter.find((f: any) => f.range?.event_time);
    expect(rangeFilter.range.event_time.gte).toBe(baseParams.timeRange.from);
  });

  it('should apply category filter', async () => {
    mockSearch.mockResolvedValueOnce({
      body: { hits: { hits: [], total: { value: 0 } } },
    });
    await searchClient.searchEvents({ ...baseParams, categories: ['AUTHENTICATION'] });
    const body = mockSearch.mock.calls[0][0].body;
    const catFilter = body.query.bool.filter.find((f: any) => f.terms?.category);
    expect(catFilter.terms.category).toContain('AUTHENTICATION');
  });

  it('should cap pageSize at 500', async () => {
    mockSearch.mockResolvedValueOnce({
      body: { hits: { hits: [], total: { value: 0 } } },
    });
    await searchClient.searchEvents({ ...baseParams, pageSize: 9999 });
    const body = mockSearch.mock.calls[0][0].body;
    expect(body.size).toBe(500);
  });

  it('should reject searchByCorrelationId if tenantId is blank', async () => {
    await expect(
      searchClient.searchByCorrelationId('', 'corr-001', baseParams.timeRange)
    ).rejects.toThrow('tenantId is required');
  });

  it('should call count index correctly', async () => {
    mockCount.mockResolvedValueOnce({ body: { count: 42 } });
    const result = await searchClient.count('tenant-alpha', [], baseParams.timeRange);
    expect(result).toBe(42);
    expect(mockCount).toHaveBeenCalledWith(
      expect.objectContaining({ index: 'cybermind-events-read' })
    );
  });
});
