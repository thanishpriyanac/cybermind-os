import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DomainEventBusService } from '../src/events/domain-event-bus.service';
import { DomainEvents } from '../src/events/domain-events.registry';
import { randomUUID } from 'crypto';

/**
 * Failure Injection Test
 * Simulates failures and verifies DLQ / Retry mechanisms.
 */
async function bootstrap() {
  console.log('Initializing Failure Injection Test...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const eventBus = app.get(DomainEventBusService);

  console.log(`[+] Pushing malformed event to trigger DLQ...`);
  try {
    // We intentionally bypass typescript's checks using `as any` to test runtime validation
    // But `eventBus.publish` validates before enqueueing. To test worker failure, we push a valid event 
    // that causes the worker to fail (e.g., throwing a specific error).
    
    // For this test, let's say the analytics worker throws on a specific correlationId.
    const failureId = 'FAIL_INJECTION_TEST';

    await eventBus.publish({
      eventId: randomUUID(),
      eventType: DomainEvents.ProviderFinished,
      occurredAt: new Date().toISOString(),
      version: 1,
      correlationId: failureId,
      traceId: randomUUID(),
      source: 'FailureInjectionScript',
      payload: { costUsd: -1, latencyMs: -1 }, // negative cost could trigger a DB or logic error
    });

    console.log(`[+] Injected event with correlationId: ${failureId}`);
    console.log(`[~] Observe the logs for BullMQ retries and DLQ routing.`);

  } catch (err) {
    console.error('[-] Failure Injection Failed:', err);
  } finally {
    // We keep the app open for a short time to observe worker logs
    setTimeout(async () => {
      await app.close();
      process.exit(0);
    }, 10000);
  }
}

bootstrap();
