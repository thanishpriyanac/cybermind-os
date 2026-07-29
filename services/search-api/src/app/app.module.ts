import { Module } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';
import { SearchController } from './search.controller';
import { SearchService } from '../domain/services/search.service';
import { QueryBuilder } from '../domain/query-builder/query-builder';
import { CybermindSearchClient } from '../../../../packages/sdk/search-client/src/search-client';

@Module({
  controllers: [SearchController],
  providers: [
    // OpenSearch Client
    {
      provide: Client,
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
    // SDK
    {
      provide: CybermindSearchClient,
      useFactory: (client: Client) => new CybermindSearchClient(client),
      inject: [Client],
    },
    // Domain
    QueryBuilder,
    SearchService,
  ],
})
export class AppModule {}
