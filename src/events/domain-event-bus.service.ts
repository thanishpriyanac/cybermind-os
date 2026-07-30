import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DomainEvent } from './domain-event.interface';

@Injectable()
export class DomainEventBusService {
  private readonly logger = new Logger(DomainEventBusService.name);

  constructor(
    @InjectQueue('domain.audit') private readonly auditQueue: Queue,
    @InjectQueue('domain.memory') private readonly memoryQueue: Queue,
    @InjectQueue('domain.kg') private readonly kgQueue: Queue,
    @InjectQueue('domain.analytics') private readonly analyticsQueue: Queue,
  ) {}

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    this.validateEvent(event);
    
    const jobOpts = {
      jobId: event.eventId, // helps with idempotency / deduplication in BullMQ
      removeOnComplete: true,
      removeOnFail: false, // leave in queue for DLQ processing if max retries fail
    };

    // Fan-out event to all domain queues
    await Promise.all([
      this.auditQueue.add(event.eventType, event, jobOpts),
      this.memoryQueue.add(event.eventType, event, jobOpts),
      this.kgQueue.add(event.eventType, event, jobOpts),
      this.analyticsQueue.add(event.eventType, event, jobOpts),
    ]);

    this.logger.debug(`Published domain event: ${event.eventType} [${event.eventId}]`);
  }

  private validateEvent(event: DomainEvent<any>) {
    if (!event.eventId) throw new BadRequestException('eventId is required');
    if (!event.eventType) throw new BadRequestException('eventType is required');
    if (!event.occurredAt || isNaN(Date.parse(event.occurredAt))) {
      throw new BadRequestException('occurredAt must be a valid ISO timestamp');
    }
    if (!event.version || event.version < 1) {
      throw new BadRequestException('version must be >= 1');
    }
    if (!event.correlationId) throw new BadRequestException('correlationId is required');
    if (!event.traceId) throw new BadRequestException('traceId is required');
    if (!event.source) throw new BadRequestException('source is required');
  }
}
