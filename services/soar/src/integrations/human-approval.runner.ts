import { Injectable } from '@nestjs/common';
import { ActionRunner, ActionContext, ActionResult } from '../engine/engine.interface';
import { PrismaService } from '../app/prisma.service';

@Injectable()
export class HumanApprovalRunner implements ActionRunner {
  readonly actionName = 'human_approval';

  constructor(private readonly prisma: PrismaService) {}

  async execute(context: ActionContext): Promise<ActionResult> {
    const approver = context.inputs.approver ?? 'SOC_ANALYST';
    const timeoutMinutes = parseInt(context.inputs.timeoutMinutes ?? '60', 10);
    const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

    await this.prisma.approvalRequest.create({
      data: {
        tenantId: context.tenantId,
        executionId: context.executionId,
        stepId: context.stepId,
        approver,
        status: 'PENDING',
        expiresAt,
      }
    });

    // Returning WAITING_APPROVAL halts the sequential engine until externally resumed
    return { status: 'WAITING_APPROVAL' };
  }
}
