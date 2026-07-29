import { Kafka, Producer, Partitioners } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { CloudEvent, PublishOptions } from './cloud-event';

export class CybermindKafkaPublisher {
  private kafka: Kafka;
  private producer: Producer;
  private sourceName: string;

  constructor(options: { clientId: string; brokers: string[]; sourceName: string }) {
    this.sourceName = options.sourceName;
    this.kafka = new Kafka({
      clientId: options.clientId,
      brokers: options.brokers,
    });
    this.producer = this.kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
  }

  async connect() {
    await this.producer.connect();
  }

  async disconnect() {
    await this.producer.disconnect();
  }

  async publish<T>(topic: string, type: string, data: T, options?: PublishOptions): Promise<void> {
    const event: CloudEvent<T> = {
      id: uuidv4(),
      source: this.sourceName,
      type,
      specversion: '1.0',
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data,
      schemaVersion: '1.0',
      platformVersion: '1.0',
      tenantId: options?.tenantId,
      correlationId: options?.correlationId || uuidv4(),
      causationId: options?.causationId,
      traceId: options?.traceId,
      actorId: options?.actorId,
    };

    await this.producer.send({
      topic,
      acks: -1, // Wait for all replicas (at-least-once reliability)
      messages: [
        {
          key: options?.tenantId || uuidv4(), // Partition by tenant if available
          value: JSON.stringify(event),
        },
      ],
    });
  }
}
