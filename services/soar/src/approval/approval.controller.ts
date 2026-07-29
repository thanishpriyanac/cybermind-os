import { Controller, Post, Body, Param, Headers, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { SoarEngine } from '../engine/soar-engine';

@Controller('v1/soar/approvals')
export class ApprovalController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: SoarEngine,
  ) {}

  @Post(':id/resolve')
  async resolveApproval(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id') approvalId: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; comment?: string }
  ) {
    if (!tenantId || !userId) throw new UnauthorizedException();
    if (body.status !== 'APPROVED' && body.status !== 'REJECTED') {
      throw new BadRequestException('Status must be APPROVED or REJECTED');
    }

    const approval = await this.prisma.approvalRequest.findUnique({ where: { id: approvalId } });
    if (!approval || approval.tenantId !== tenantId) throw new UnauthorizedException('Approval not found');
    if (approval.status !== 'PENDING') throw new BadRequestException('Approval is no longer pending');

    await this.prisma.approvalRequest.update({
      where: { id: approvalId },
      data: { status: body.status, comment: body.comment, approvedAt: new Date(), approver: userId }
    });

    if (body.status === 'APPROVED') {
      // Resume the SOAR execution
      await this.engine.resumeExecution(approval.executionId, { approvalStatus: 'APPROVED', approvedBy: userId });
    } else {
      // If rejected, we mark the execution as FAILED
      await this.prisma.playbookExecution.update({
        where: { id: approval.executionId },
        data: { status: 'FAILED', completedAt: new Date() }
      });
      // Also log the failure action
      await this.prisma.actionExecutionLog.create({
        data: {
          tenantId,
          executionId: approval.executionId,
          stepId: approval.stepId,
          actionName: 'human_approval',
          actor: userId,
          inputs: {},
          outputs: { reason: body.comment },
          status: 'FAILED',
        }
      });
    }

    return { success: true };
  }
}
