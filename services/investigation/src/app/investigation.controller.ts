import {
  Controller, Get, Post, Patch, Param, Body, Headers,
  UnauthorizedException, BadRequestException, Logger,
} from '@nestjs/common';
import { InvestigationService } from '../domain/investigation.service';
import { CaseStatus } from '../domain/investigation.interface';

@Controller('v1/investigations')
export class InvestigationController {
  private readonly logger = new Logger(InvestigationController.name);

  constructor(private readonly service: InvestigationService) {}

  @Post()
  async createCase(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    this.requireTenant(tenantId);
    return this.service.createCase(tenantId, {
      title: body.title,
      description: body.description,
      severity: body.severity ?? 'MEDIUM',
      tags: body.tags ?? [],
      relatedAlertIds: body.relatedAlertIds ?? [],
      relatedAssetIds: body.relatedAssetIds ?? [],
    });
  }

  @Get()
  async listCases(@Headers('x-tenant-id') tenantId: string) {
    this.requireTenant(tenantId);
    return this.service.listCases(tenantId);
  }

  @Get(':id')
  async getCase(@Headers('x-tenant-id') tenantId: string, @Param('id') caseId: string) {
    this.requireTenant(tenantId);
    return this.service.getCase(tenantId, caseId);
  }

  @Patch(':id/assign')
  async assign(@Headers('x-tenant-id') tenantId: string, @Param('id') caseId: string, @Body() body: { assigneeId: string }) {
    this.requireTenant(tenantId);
    return this.service.assignCase(tenantId, caseId, body.assigneeId);
  }

  @Patch(':id/status')
  async transitionStatus(@Headers('x-tenant-id') tenantId: string, @Param('id') caseId: string, @Body() body: { status: CaseStatus }) {
    this.requireTenant(tenantId);
    return this.service.transitionStatus(tenantId, caseId, body.status);
  }

  @Post(':id/evidence')
  async addEvidence(@Headers('x-tenant-id') tenantId: string, @Param('id') caseId: string, @Body() body: any) {
    this.requireTenant(tenantId);
    return this.service.addEvidence(tenantId, caseId, {
      type: body.type,
      title: body.title,
      content: body.content,
      addedBy: body.addedBy,
    });
  }

  @Get(':id/evidence')
  async listEvidence(@Headers('x-tenant-id') tenantId: string, @Param('id') caseId: string) {
    this.requireTenant(tenantId);
    return this.service.listEvidence(tenantId, caseId);
  }

  @Post(':id/notes')
  async addNote(@Headers('x-tenant-id') tenantId: string, @Param('id') caseId: string, @Body() body: { authorId: string; content: string }) {
    this.requireTenant(tenantId);
    return this.service.addNote(tenantId, caseId, body.authorId, body.content);
  }

  @Get(':id/notes')
  async listNotes(@Headers('x-tenant-id') tenantId: string, @Param('id') caseId: string) {
    this.requireTenant(tenantId);
    return this.service.listNotes(tenantId, caseId);
  }

  private requireTenant(tenantId: string) {
    if (!tenantId?.trim()) throw new UnauthorizedException('x-tenant-id header is required');
  }
}
