import {
  Controller, Post, Get, Body, Headers, Query,
  BadRequestException, UnauthorizedException, Logger
} from '@nestjs/common';
import { SearchService } from '../domain/services/search.service';
import { SearchRequest } from '../domain/query-builder/query-builder';
import { AggregateParams, TimelineParams } from '../../../../packages/sdk/search-client/src/search-client';

@Controller('v1/search')
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}

  /**
   * POST /api/v1/search/events
   * Primary event search endpoint for SOC analysts.
   */
  @Post('events')
  async searchEvents(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: Omit<SearchRequest, 'tenantId'>,
  ) {
    this.validateTenant(tenantId);
    this.validateTimeRange(body.timeRange);
    try {
      return await this.searchService.searchEvents({ ...body, tenantId });
    } catch (e: any) {
      this.logger.warn(`searchEvents error: ${e.message}`);
      throw new BadRequestException(e.message);
    }
  }

  /**
   * POST /api/v1/search/alerts
   * Alert search endpoint.
   */
  @Post('alerts')
  async searchAlerts(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: Omit<SearchRequest, 'tenantId'>,
  ) {
    this.validateTenant(tenantId);
    this.validateTimeRange(body.timeRange);
    try {
      return await this.searchService.searchAlerts({ ...body, tenantId });
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * POST /api/v1/search/aggregate
   * Aggregation endpoint for dashboards.
   * Examples: events by severity, MITRE tactic distribution, event volume over time.
   */
  @Post('aggregate')
  async aggregate(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: Omit<AggregateParams, 'tenantId'>,
  ) {
    this.validateTenant(tenantId);
    this.validateTimeRange(body.timeRange);
    if (!body.groupBy?.length) {
      throw new BadRequestException('groupBy must contain at least one field');
    }
    try {
      return await this.searchService.aggregate({ ...body, tenantId });
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  /**
   * GET /api/v1/search/timeline
   * Timeline endpoint for chronological investigation views.
   * Supports: assetId, correlationId, time range.
   */
  @Get('timeline')
  async timeline(
    @Headers('x-tenant-id') tenantId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('assetId') assetId?: string,
    @Query('correlationId') correlationId?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    this.validateTenant(tenantId);
    if (!from || !to) throw new BadRequestException('from and to query params are required');

    const params: TimelineParams = {
      tenantId,
      timeRange: { from, to },
      assetId,
      correlationId,
      pageSize: pageSize ? parseInt(pageSize, 10) : 200,
    };

    try {
      return await this.searchService.timeline(tenantId, params);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  private validateTenant(tenantId: string) {
    if (!tenantId?.trim()) {
      throw new UnauthorizedException('x-tenant-id header is required');
    }
  }

  private validateTimeRange(timeRange?: { from?: string; to?: string }) {
    if (!timeRange?.from || !timeRange?.to) {
      throw new BadRequestException('timeRange.from and timeRange.to are required');
    }
    if (new Date(timeRange.from) > new Date(timeRange.to)) {
      throw new BadRequestException('timeRange.from must be before timeRange.to');
    }
  }
}
