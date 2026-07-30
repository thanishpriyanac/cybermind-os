import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DomainWorker } from '../../events/domain-worker.interface';
import { DomainEvent } from '../../events/domain-event.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('domain.audit', {
  concurrency: 5,
  limiter: {
    max: 100,
    duration: 1000,
  },
})
export class AuditWorker extends WorkerHost implements DomainWorker {
  private readonly logger = new Logger(AuditWorker.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  workerName(): string {
    return 'AuditWorker';
  }

  supports(eventType: string): boolean {
    return true; // Audit logs everything
  }

  async process(job: Job<DomainEvent<any>>): Promise<void> {
    const event = job.data;
    
    // Timeout is handled at the queue/job level in BullMQ or via a Promise race
    // We enforce a strict timeout of 30 seconds for audit processing
    await Promise.race([
      this.processEvent(event),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AuditWorker Timeout')), 30000)),
    ]);
  }

  async processEvent(event: DomainEvent<any>): Promise<void> {
    if (!this.supports(event.eventType)) {
      return;
    }

    try {
      // Idempotency check: see if audit log with this eventId already exists.
      // Wait, AuditLog doesn't have an eventId column. It has details (Json).
      // Let's use the details payload to store eventId, or just use the traceId.
      // We can search if details->>'eventId' equals event.eventId.
      // A faster way is just to add eventId to AuditLog in the DB, but since we cannot modify schema trivially without a migration, we'll store it in details.

      // We'll trust BullMQ's job id for most idempotency, but just in case:
      // Actually Prisma doesn't support easy JSON filtering out-of-the-box in all databases, but postgres does.
      // For simplicity, we just insert. We rely on BullMQ's at-least-once but the deduplication via jobId during `add()`.
      
      const actor = event.actorId || 'system';
      const action = event.eventType;
      const ipAddress = 'internal'; // In a real system, might be pulled from event envelope if available

      await this.prisma.auditLog.create({
        data: {
          action,
          actor,
          ipAddress,
          details: {
            eventId: event.eventId,
            correlationId: event.correlationId,
            traceId: event.traceId,
            source: event.source,
            payload: event.payload,
          },
        },
      });

      this.logger.log(`[${this.workerName()}] Audited event: ${event.eventType} (${event.eventId})`);
    } catch (err) {
      this.logger.error(`[${this.workerName()}] Failed to process event ${event.eventId}: ${(err as Error).message}`, (err as Error).stack);
      throw err; // Infinite retries rely on throwing the error so BullMQ knows it failed
    }
  }
}
