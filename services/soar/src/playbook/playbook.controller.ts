import { Controller, Post, Get, Body, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { SoarEngine } from '../engine/soar-engine';

@Controller('v1/soar/playbooks')
export class PlaybookController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: SoarEngine,
  ) {}

  @Post()
  async createPlaybook(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { name: string; description?: string; triggerType: string; triggerRule?: any; steps: any[] }
  ) {
    if (!tenantId) throw new UnauthorizedException();
    return this.prisma.playbook.create({
      data: {
        tenantId,
        name: body.name,
        description: body.description,
        status: 'DRAFT',
        triggerType: body.triggerType,
        triggerRule: body.triggerRule ?? {},
        steps: body.steps,
      }
    });
  }

  @Post(':id/publish')
  async publishPlaybook(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new UnauthorizedException();
    return this.prisma.playbook.update({
      where: { id, tenantId },
      data: { status: 'ENABLED' }
    });
  }

  @Post(':id/trigger')
  async triggerPlaybook(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body() body: { context?: Record<string, any> }
  ) {
    if (!tenantId || !userId) throw new UnauthorizedException();
    const executionId = await this.engine.triggerPlaybook(tenantId, id, userId, body.context ?? {});
    return { executionId };
  }

  @Get('executions/:id')
  async getExecution(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new UnauthorizedException();
    return this.prisma.playbookExecution.findUnique({
      where: { id, tenantId },
      include: { actionLogs: true, approvals: true }
    });
  }
}
