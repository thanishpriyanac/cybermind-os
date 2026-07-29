import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ActionRunner, ActionContext, ActionResult } from '../engine/engine.interface';
import { Queue, Worker, Job } from 'bullmq';
import { SoarEngine } from '../engine/soar-engine';
import IORedis from 'ioredis';

@Injectable()
export class WaitRunner implements ActionRunner, OnModuleInit, OnModuleDestroy {
  readonly actionName = 'wait';
  private readonly logger = new Logger(WaitRunner.name);
  private queue: Queue;
  private worker: Worker;
  private redisConnection: IORedis;

  constructor(private readonly engine: SoarEngine) {
    this.redisConnection = new IORedis(process.env.REDIS_URL || 'redis://redis:6379');
    this.queue = new Queue('soar-wait-queue', { connection: this.redisConnection });
  }

  async onModuleInit() {
    this.worker = new Worker(
      'soar-wait-queue',
      async (job: Job) => {
        const { executionId } = job.data;
        this.logger.log(`Wait complete for execution ${executionId}. Resuming...`);
        // We use WAITING_APPROVAL as the generalized "PAUSED" state in v0.8.0
        await this.engine.resumeExecution(executionId, { waitComplete: true });
      },
      { connection: this.redisConnection }
    );
  }

  async onModuleDestroy() {
    await this.worker.close();
    await this.queue.close();
    this.redisConnection.disconnect();
  }

  async execute(context: ActionContext): Promise<ActionResult> {
    const seconds = parseInt(context.inputs.seconds ?? '0', 10);
    
    if (seconds <= 0) {
      return { status: 'SUCCESS' };
    }

    await this.queue.add(
      'resume-execution',
      { executionId: context.executionId },
      { delay: seconds * 1000 }
    );

    this.logger.log(`Execution ${context.executionId} paused for ${seconds} seconds`);
    return { status: 'WAITING_APPROVAL' }; // Halts the engine
  }
}
