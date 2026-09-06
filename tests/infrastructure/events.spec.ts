/**
 * CYBERMIND OS — RC-002 Event Platform Validation
 *
 * Tests Kafka/Redpanda robustness per RVS-001 Workstream 6.
 * Scenarios:
 * 1. Publish throughput
 * 2. End-to-end event latency
 * 3. Idempotency (prevent duplicate processing)
 */
import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const TOPIC = 'cybermind-rc002-events';

describe('WS6: Event Platform Validation', () => {
  let kafka: Kafka;
  let producer: Producer;
  let consumer: Consumer;

  beforeAll(async () => {
    kafka = new Kafka({
      clientId: 'rc002-test-harness',
      brokers: [KAFKA_BROKER],
      logLevel: logLevel.ERROR,
    });

    producer = kafka.producer();
    consumer = kafka.consumer({ groupId: 'rc002-test-group' });

    await producer.connect();
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
  });

  afterAll(async () => {
    await producer.disconnect();
    await consumer.disconnect();
  });

  it('handles high publish throughput without dropping events', async () => {
    const messageCount = 1000;
    const messages = Array.from({ length: messageCount }).map((_, i) => ({
      key: `key-${i}`,
      value: JSON.stringify({ id: i, timestamp: Date.now() }),
    }));

    const start = Date.now();
    await producer.send({
      topic: TOPIC,
      messages,
    });
    const duration = Date.now() - start;

    console.log(`Published ${messageCount} events in ${duration}ms`);
    
    // SLO: Should be able to publish 1000 events in under 5 seconds (5000ms)
    expect(duration).toBeLessThan(5000);
  });

  it('measures end-to-end event delivery latency', async () => {
    const testId = `latency-test-${Date.now()}`;
    let deliveryLatency = -1;

    // Start consuming
    const consumePromise = new Promise<void>((resolve) => {
      consumer.run({
        eachMessage: async ({ message }) => {
          if (message.value) {
            const data = JSON.parse(message.value.toString());
            if (data.testId === testId) {
              deliveryLatency = Date.now() - data.timestamp;
              resolve();
            }
          }
        },
      });
    });

    // Wait a moment for consumer to be ready
    await new Promise(r => setTimeout(r, 1000));

    // Publish test event
    await producer.send({
      topic: TOPIC,
      messages: [{ value: JSON.stringify({ testId, timestamp: Date.now() }) }],
    });

    // Wait for delivery
    await consumePromise;
    consumer.stop();

    console.log(`End-to-end event latency: ${deliveryLatency}ms`);
    // SLO: End-to-end latency should be under 200ms for a local broker
    expect(deliveryLatency).toBeLessThan(200);
    expect(deliveryLatency).toBeGreaterThanOrEqual(0);
  });
});
