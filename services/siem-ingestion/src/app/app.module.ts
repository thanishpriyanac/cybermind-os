import { Module } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';
import { EventPlatformModule } from '../../../../packages/sdk/event-client/src/nestjs-integration';
import { SiemIngestionService } from '../domain/siem-ingestion.service';
import { OpenSearchIndexer } from '../infrastructure/opensearch/opensearch-indexer.service';
import { BulkWriter } from '../infrastructure/opensearch/bulk-writer.service';
import { RetryQueue } from '../infrastructure/retry/retry-queue.service';
import { IndexTemplateManager } from '../infrastructure/opensearch/index-template.manager';

const OPENSEARCH_CLIENT = 'OPENSEARCH_CLIENT';

@Module({
  imports: [
    EventPlatformModule.forRoot({
      clientId: 'siem-ingestion',
      brokers: [(process.env.KAFKA_BROKER ?? 'localhost:9092')],
      sourceName: '/cybermind/siem',
    }),
  ],
  providers: [
    // OpenSearch Client
    {
      provide: OPENSEARCH_CLIENT,
      useFactory: () =>
        new Client({
          node: process.env.OPENSEARCH_NODE ?? 'http://localhost:9200',
          auth: {
            username: process.env.OPENSEARCH_USER ?? 'admin',
            password: process.env.OPENSEARCH_PASSWORD ?? 'admin',
          },
          ssl: { rejectUnauthorized: false },
        }),
    },
    {
      provide: Client,
      useExisting: OPENSEARCH_CLIENT,
    },
    // Infrastructure
    IndexTemplateManager,
    OpenSearchIndexer,
    BulkWriter,
    RetryQueue,
    // Domain
    SiemIngestionService,
  ],
})
export class AppModule {}
