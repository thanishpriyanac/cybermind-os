import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { ActionRunner, ActionContext, PlaybookData, PlaybookStep } from './engine.interface';

@Injectable()
export class SoarEngine {
  private readonly logger = new Logger(SoarEngine.name);
  private runners = new Map<string, ActionRunner>();

  constructor(private readonly prisma: PrismaService) {}

  registerRunner(runner: ActionRunner) {
    this.runners.set(runner.actionName, runner);
  }

  /**
   * Start a new playbook execution.
   */
  async triggerPlaybook(tenantId: string, playbookId: string, triggerSource: string, initialContext: Record<string, any> = {}) {
    const playbook = await this.prisma.playbook.findUnique({ where: { id: playbookId } });
    if (!playbook || playbook.status !== 'ENABLED') {
      throw new Error(`Playbook ${playbookId} not found or not enabled`);
    }

    const steps = playbook.steps as unknown as PlaybookStep[];
    if (!steps || steps.length === 0) return;

    const execution = await this.prisma.playbookExecution.create({
      data: {
        tenantId, playbookId, triggerSource,
        status: 'RUNNING',
        currentStepId: steps[0].id,
        state: initialContext,
      }
    });

    this.logger.log(`[${tenantId}] Started Playbook ${playbookId} - Execution ${execution.id}`);
    
    // Process async so we don't block the caller
    this.processExecution(execution.id).catch(e => this.logger.error(`Execution failed: ${e.message}`));
    return execution.id;
  }

  /**
   * Resume an execution that was waiting (e.g. for Human Approval)
   */
  async resumeExecution(executionId: string, stepOutput: Record<string, any>) {
    const execution = await this.prisma.playbookExecution.findUnique({ where: { id: executionId }, include: { playbook: true } });
    if (!execution || execution.status !== 'WAITING_APPROVAL') {
      throw new Error(`Execution ${executionId} is not in a resumable state`);
    }

    // Merge new output into state
    const newState = { ...(execution.state as Record<string, any>), ...stepOutput };
    
    await this.prisma.playbookExecution.update({
      where: { id: executionId },
      data: { status: 'RUNNING', state: newState }
    });

    this.logger.log(`Resuming Execution ${executionId} from step ${execution.currentStepId}`);
    
    // Find next step and continue
    const steps = execution.playbook.steps as unknown as PlaybookStep[];
    const currentIndex = steps.findIndex(s => s.id === execution.currentStepId);
    
    if (currentIndex >= 0 && currentIndex + 1 < steps.length) {
      await this.prisma.playbookExecution.update({
        where: { id: executionId },
        data: { currentStepId: steps[currentIndex + 1].id }
      });
      this.processExecution(executionId).catch(e => this.logger.error(e.message));
    } else {
      // It was the last step
      await this.prisma.playbookExecution.update({
        where: { id: executionId },
        data: { status: 'COMPLETED', completedAt: new Date() }
      });
      this.logger.log(`Execution ${executionId} COMPLETED`);
    }
  }

  /**
   * Internal loop: execute steps sequentially until WAITING_APPROVAL, COMPLETED, or FAILED.
   */
  private async processExecution(executionId: string) {
    let execution = await this.prisma.playbookExecution.findUnique({
      where: { id: executionId }, include: { playbook: true }
    });
    if (!execution) return;

    const steps = execution.playbook.steps as unknown as PlaybookStep[];
    
    while (execution.status === 'RUNNING' && execution.currentStepId) {
      const stepIndex = steps.findIndex(s => s.id === execution.currentStepId);
      if (stepIndex === -1) {
        await this.markFailed(executionId, 'Current step not found in playbook');
        return;
      }
      
      const step = steps[stepIndex];
      const runner = this.runners.get(step.action);
      
      if (!runner) {
        await this.markFailed(executionId, `Action runner '${step.action}' not found`);
        return;
      }

      // Execute Action
      const startTime = Date.now();
      const context: ActionContext = {
        executionId,
        tenantId: execution.tenantId,
        playbookId: execution.playbookId,
        stepId: step.id,
        inputs: this.resolveInputs(step.config, execution.state as Record<string, any>),
        state: execution.state as Record<string, any>,
      };

      try {
        const result = await runner.execute(context);
        const durationMs = Date.now() - startTime;

        // Audit Log
        await this.prisma.actionExecutionLog.create({
          data: {
            tenantId: execution.tenantId, executionId, stepId: step.id,
            actionName: step.action, actor: 'SYSTEM', inputs: context.inputs,
            outputs: result.outputs ?? {}, status: result.status, durationMs
          }
        });

        if (result.status === 'FAILED') {
          await this.markFailed(executionId, result.error ?? 'Action failed');
          return;
        }

        if (result.status === 'WAITING_APPROVAL') {
          await this.prisma.playbookExecution.update({
            where: { id: executionId },
            data: { status: 'WAITING_APPROVAL' }
          });
          this.logger.log(`Execution ${executionId} PAUSED - Waiting Approval`);
          return; // Exit loop, wait for resumeExecution()
        }

        // SUCCESS -> Merge state and move to next step
        const newState = { ...(execution.state as Record<string, any>), ...result.outputs };
        const nextStep = steps[stepIndex + 1];

        if (nextStep) {
          execution = await this.prisma.playbookExecution.update({
            where: { id: executionId },
            data: { state: newState, currentStepId: nextStep.id },
            include: { playbook: true }
          });
        } else {
          await this.prisma.playbookExecution.update({
            where: { id: executionId },
            data: { state: newState, currentStepId: null, status: 'COMPLETED', completedAt: new Date() }
          });
          this.logger.log(`Execution ${executionId} COMPLETED`);
          return;
        }

      } catch (err: any) {
        await this.markFailed(executionId, err.message);
        return;
      }
    }
  }

  private async markFailed(executionId: string, errorMsg: string) {
    this.logger.error(`Execution ${executionId} FAILED: ${errorMsg}`);
    await this.prisma.playbookExecution.update({
      where: { id: executionId },
      data: { status: 'FAILED', completedAt: new Date() }
    });
  }

  /**
   * Extremely simple templating: resolve inputs like "{{alert.severity}}" from state
   */
  private resolveInputs(config: Record<string, any>, state: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {};
    for (const [k, v] of Object.entries(config)) {
      if (typeof v === 'string' && v.startsWith('{{') && v.endsWith('}}')) {
        const path = v.slice(2, -2).trim();
        resolved[k] = this.getValueByPath(state, path) ?? v;
      } else {
        resolved[k] = v;
      }
    }
    return resolved;
  }

  private getValueByPath(obj: any, path: string) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }
}
