import {
  Controller, Get, Post, Patch, Param, Body, Headers,
  UnauthorizedException, BadRequestException, Logger,
} from '@nestjs/common';
import { AlertManagementService } from '../domain/alert-management.service';
import { Alert, AlertStatus } from '../../../../packages/schemas/src/siem/alert';

@Controller('v1/alerts')
export class AlertController {
  private readonly logger = new Logger(AlertController.name);

  constructor(private readonly service: AlertManagementService) {}

  /** GET /api/v1/alerts — list open alerts for tenant */
  @Get()
  async listOpen(@Headers('x-tenant-id') tenantId: string) {
    this.requireTenant(tenantId);
    return this.service.listOpenAlerts(tenantId);
  }

  /** GET /api/v1/alerts/:id */
  @Get(':id')
  async getAlert(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') alertId: string,
  ) {
    this.requireTenant(tenantId);
    return this.service.getAlert(tenantId, alertId);
  }

  /** PATCH /api/v1/alerts/:id/assign */
  @Patch(':id/assign')
  async assign(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') alertId: string,
    @Body() body: { assigneeId: string },
  ) {
    this.requireTenant(tenantId);
    if (!body.assigneeId) throw new BadRequestException('assigneeId is required');
    return this.service.assignAlert(tenantId, alertId, body.assigneeId);
  }

  /** PATCH /api/v1/alerts/:id/status */
  @Patch(':id/status')
  async transitionStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') alertId: string,
    @Body() body: { status: AlertStatus; closureNotes?: string },
  ) {
    this.requireTenant(tenantId);
    if (!body.status) throw new BadRequestException('status is required');
    return this.service.transitionStatus(tenantId, alertId, body.status, body.closureNotes);
  }

  /** PATCH /api/v1/alerts/:id/suppress */
  @Patch(':id/suppress')
  async suppress(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') alertId: string,
    @Body() body: { suppressedUntil: string },
  ) {
    this.requireTenant(tenantId);
    if (!body.suppressedUntil) throw new BadRequestException('suppressedUntil is required');
    return this.service.suppressAlert(tenantId, alertId, body.suppressedUntil);
  }

  private requireTenant(tenantId: string) {
    if (!tenantId?.trim()) throw new UnauthorizedException('x-tenant-id header is required');
  }
}
