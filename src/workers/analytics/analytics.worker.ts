import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DomainWorker } from '../../events/domain-worker.interface';
import { DomainEvent } from '../../events/domain-event.interface';
import { DomainEvents } from '../../events/domain-events.registry';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Processor('domain.analytics', {
  concurrency: 5,
})
export class AnalyticsWorker extends WorkerHost implements DomainWorker {
  private readonly logger = new Logger(AnalyticsWorker.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  workerName(): string {
    return 'AnalyticsWorker';
  }

  supports(eventType: string): boolean {
    return eventType === DomainEvents.ProviderFinished;
  }

  async process(job: Job<DomainEvent<any>>): Promise<void> {
    const event = job.data;
    
    // 15s timeout for Analytics
    await Promise.race([
      this.processEvent(event),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AnalyticsWorker Timeout')), 30000)),
    ]);
  }

  async processEvent(event: DomainEvent<any>): Promise<void> {
    if (!this.supports(event.eventType)) {
      return;
    }

    try {
      // Deduplication based on eventId could be done by checking AuditLog or a processed events table.
      // We will assume BullMQ handles deduplication for most cases. If we needed strict exactly-once, 
      // we would use a Redis SET or a ProcessedEvents table in Postgres.
      
      const payload = event.payload;
      if (!payload) return;

      const costUsd = new Prisma.Decimal(payload.costUsd || 0);
      const latencyMs = new Prisma.Decimal(payload.latencyMs || 0);

      // We'll update the total platform cost and total platform requests
      // Uses raw query for atomicity incrementing if needed, but Prisma upsert works fine with a transaction.
      // Wait, Prisma doesn't have an easy atomic increment on decimals. We can do it inside a transaction.
      
      await this.prisma.$transaction(async (tx) => {
        // Update Total Cost
        const costMetric = await tx.platformMetric.upsert({
          where: { metricKey: 'total_cost_usd' },
          update: {},
          create: { metricKey: 'total_cost_usd', value: 0 }
        });
        await tx.platformMetric.update({
          where: { metricKey: 'total_cost_usd' },
          data: { value: costMetric.value.add(costUsd) }
        });

        // Update Total Requests
        const reqMetric = await tx.platformMetric.upsert({
          where: { metricKey: 'total_requests' },
          update: {},
          create: { metricKey: 'total_requests', value: 0 }
        });
        await tx.platformMetric.update({
          where: { metricKey: 'total_requests' },
          data: { value: reqMetric.value.add(1) }
        });
        
        // Update specific provider cost
        if (payload.provider) {
          const providerCostKey = `provider_cost_${payload.provider}`;
          const pCostMetric = await tx.platformMetric.upsert({
            where: { metricKey: providerCostKey },
            update: {},
            create: { metricKey: providerCostKey, value: 0 }
          });
          await tx.platformMetric.update({
            where: { metricKey: providerCostKey },
            data: { value: pCostMetric.value.add(costUsd) }
          });
        }
      });

      this.logger.log(`[${this.workerName()}] Updated analytics for event ${event.eventId} (Cost: $${costUsd.toString()})`);
    } catch (err) {
      this.logger.error(`[${this.workerName()}] Failed to process analytics for event ${event.eventId}: ${(err as Error).message}`, (err as Error).stack);
      throw err;
    }
  }
}
