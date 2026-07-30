import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DomainEventBusService } from './domain-event-bus.service';
import { RedisPubSubService } from './redis-pubsub.service';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host') || 'localhost',
          port: configService.get<number>('redis.port') || 6379,
          password: configService.get<string>('redis.password'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'domain.audit' },
      { name: 'domain.memory' },
      { name: 'domain.kg' },
      { name: 'domain.analytics' }
    ),
  ],
  providers: [DomainEventBusService, RedisPubSubService],
  exports: [DomainEventBusService, RedisPubSubService, BullModule],
})
export class EventsModule {}
