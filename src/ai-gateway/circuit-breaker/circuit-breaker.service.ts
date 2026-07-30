import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CircuitState {
  consecutiveFailures: number;
  status: 'ONLINE' | 'DEGRADED' | 'CIRCUIT_OPEN';
  openedAt?: Date;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly states = new Map<string, CircuitState>();

  private readonly FAILURE_THRESHOLD = 3;
  private readonly COOLDOWN_MS = 300 * 1000; // 5 minutes

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if execution is allowed for provider model key
   */
  canExecute(modelKey: string): boolean {
    const state = this.getState(modelKey);

    if (state.status === 'CIRCUIT_OPEN') {
      if (state.openedAt && Date.now() - state.openedAt.getTime() > this.COOLDOWN_MS) {
        this.logger.log(`Circuit cooldown expired for ${modelKey}. Transitioning to DEGRADED trial state.`);
        this.updateState(modelKey, 'DEGRADED', 0);
        return true;
      }
      return false; // Block execution while Circuit is Open
    }

    return true;
  }

  /**
   * Report successful execution
   */
  async recordSuccess(provider: string, modelKey: string) {
    const currentState = this.getState(modelKey);
    if (currentState.status !== 'ONLINE' || currentState.consecutiveFailures > 0) {
      await this.recordHealthEvent(provider, modelKey, currentState.status, 'ONLINE', 'Successful response received');
    }
    this.updateState(modelKey, 'ONLINE', 0);
  }

  /**
   * Report failed execution
   */
  async recordFailure(provider: string, modelKey: string, reason: string) {
    const state = this.getState(modelKey);
    const failures = state.consecutiveFailures + 1;

    this.logger.warn(`Failure recorded for ${modelKey} (${failures}/${this.FAILURE_THRESHOLD}): ${reason}`);

    if (failures >= this.FAILURE_THRESHOLD && state.status !== 'CIRCUIT_OPEN') {
      this.logger.error(`Circuit OPENED for ${modelKey} due to ${failures} consecutive failures.`);
      this.updateState(modelKey, 'CIRCUIT_OPEN', failures);
      await this.recordHealthEvent(provider, modelKey, state.status, 'CIRCUIT_OPEN', reason);
    } else {
      this.updateState(modelKey, state.status, failures);
    }
  }

  private getState(modelKey: string): CircuitState {
    if (!this.states.has(modelKey)) {
      this.states.set(modelKey, { consecutiveFailures: 0, status: 'ONLINE' });
    }
    return this.states.get(modelKey)!;
  }

  private updateState(modelKey: string, status: 'ONLINE' | 'DEGRADED' | 'CIRCUIT_OPEN', failures: number) {
    this.states.set(modelKey, {
      status,
      consecutiveFailures: failures,
      openedAt: status === 'CIRCUIT_OPEN' ? new Date() : undefined,
    });
  }

  private async recordHealthEvent(
    provider: string,
    modelKey: string,
    previousStatus: string,
    newStatus: string,
    reason: string,
  ) {
    try {
      await this.prisma.providerHealthEvent.create({
        data: {
          provider,
          modelKey,
          previousStatus,
          newStatus,
          reason,
        },
      });
      await this.prisma.providerConfiguration.update({
        where: { modelKey },
        data: { healthStatus: newStatus },
      });
    } catch (err) {
      this.logger.error(`Failed to log health event for ${modelKey}`, err);
    }
  }
}
