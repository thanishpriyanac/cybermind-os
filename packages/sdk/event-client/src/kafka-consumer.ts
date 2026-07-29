import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { CloudEvent } from './cloud-event';

export interface RetryPolicy {
  maxRetries: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
}

export class CybermindKafkaConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: import('kafkajs').Producer;
  private retryPolicy: RetryPolicy;

  constructor(options: { clientId: string; brokers: string[]; groupId: string; retryPolicy?: RetryPolicy }) {
    this.kafka = new Kafka({
      clientId: options.clientId,
      brokers: options.brokers,
    });
    this.consumer = this.kafka.consumer({ groupId: options.groupId });
    this.producer = this.kafka.producer();
    this.retryPolicy = options.retryPolicy || {
      maxRetries: 3,
      initialBackoffMs: 1000,
      maxBackoffMs: 10000,
    };
  }

  async connect() {
    await this.consumer.connect();
    await this.producer.connect();
  }

  async disconnect() {
    await this.consumer.disconnect();
    await this.producer.disconnect();
  }

  async subscribe(topic: string, fromBeginning: boolean = false) {
    await this.consumer.subscribe({ topic, fromBeginning });
  }

  async run(handler: (event: CloudEvent) => Promise<void>) {
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const { topic, message } = payload;
        if (!message.value) return;

        const event = JSON.parse(message.value.toString()) as CloudEvent;

        let attempt = 0;
        let success = false;

        while (attempt <= this.retryPolicy.maxRetries && !success) {
          try {
            await handler(event);
            success = true;
          } catch (error) {
            attempt++;
            if (attempt > this.retryPolicy.maxRetries) {
              await this.publishToDlq(topic, message.value.toString(), error);
            } else {
              const backoff = Math.min(
                this.retryPolicy.initialBackoffMs * Math.pow(2, attempt - 1),
                this.retryPolicy.maxBackoffMs
              );
              await new Promise(res => setTimeout(res, backoff));
            }
          }
        }
      },
    });
  }

  private async publishToDlq(originalTopic: string, rawMessage: string, error: any) {
    const dlqTopic = `${originalTopic}.dlq`;
    try {
      await this.producer.send({
        topic: dlqTopic,
        messages: [{
          value: JSON.stringify({
            originalTopic,
            rawMessage,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
          })
        }]
      });
      console.error(`[DLQ Route] Message moved to ${dlqTopic}. Error:`, error);
    } catch (e) {
      console.error(`CRITICAL: Failed to publish to DLQ topic ${dlqTopic}:`, e);
    }
  }
}
