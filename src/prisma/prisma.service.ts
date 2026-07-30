import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    
    // Enable slow query logging
    (this as any).$on('query', (e: any) => {
      if (e.duration > 500) { // Log queries taking longer than 500ms
        this.logger.warn(`Slow Query [${e.duration}ms]: ${e.query}`);
      }
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
