import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private publisher!: Redis;
  private subscriber!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('redis.host') || 'localhost';
    const port = this.configService.get<number>('redis.port') || 6379;
    const password = this.configService.get<string>('redis.password') || undefined;

    this.publisher = new Redis({ host, port, password, lazyConnect: true });
    this.subscriber = new Redis({ host, port, password, lazyConnect: true });

    this.logger.log(`Redis PubSub Service initialized (${host}:${port})`);
  }

  async publish(channel: string, eventData: any) {
    try {
      const payload = typeof eventData === 'string' ? eventData : JSON.stringify(eventData);
      await this.publisher.publish(channel, payload);
    } catch (err) {
      this.logger.error(`Failed to publish event to channel ${channel}`, err);
    }
  }

  subscribe(channel: string, callback: (message: string) => void) {
    this.subscriber.subscribe(channel);
    this.subscriber.on('message', (chan, msg) => {
      if (chan === channel) {
        callback(msg);
      }
    });
  }

  async onModuleDestroy() {
    await this.publisher.quit();
    await this.subscriber.quit();
  }
}
