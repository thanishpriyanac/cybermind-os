import { Module, DynamicModule, Global } from '@nestjs/common';
import { CybermindKafkaPublisher } from './kafka-publisher';

export interface EventPlatformOptions {
  clientId: string;
  brokers: string[];
  sourceName: string;
}

@Global()
@Module({})
export class EventPlatformModule {
  static forRoot(options: EventPlatformOptions): DynamicModule {
    const publisherProvider = {
      provide: CybermindKafkaPublisher,
      useFactory: async () => {
        const publisher = new CybermindKafkaPublisher(options);
        await publisher.connect();
        return publisher;
      },
    };

    return {
      module: EventPlatformModule,
      providers: [publisherProvider],
      exports: [publisherProvider],
    };
  }
}
