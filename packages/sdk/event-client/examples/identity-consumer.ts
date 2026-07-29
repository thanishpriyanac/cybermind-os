import { CybermindKafkaConsumer, CloudEvent } from '../src';

async function bootstrap() {
  const consumer = new CybermindKafkaConsumer({
    clientId: 'identity-cli-consumer',
    brokers: ['localhost:9092'],
    groupId: 'identity-cli-group',
    retryPolicy: {
      maxRetries: 3,
      initialBackoffMs: 1000,
      maxBackoffMs: 10000,
    }
  });

  await consumer.connect();
  await consumer.subscribe('identity.events', true);

  console.log('🎧 Listening for Identity domain events...');

  await consumer.run(async (event: CloudEvent) => {
    console.log(`\n📦 Received CloudEvent [${event.type}]`);
    console.log(`- ID: ${event.id}`);
    console.log(`- Source: ${event.source}`);
    console.log(`- Time: ${event.time}`);
    console.log(`- TenantID: ${event.tenantId || 'N/A'}`);
    console.log(`- CorrelationID: ${event.correlationId}`);
    console.log(`- Data:`, JSON.stringify(event.data, null, 2));

    // Simulate validation logic
    if (!event.type || !event.data) {
      throw new Error('Invalid CloudEvent structure');
    }
  });
}

bootstrap().catch(console.error);
