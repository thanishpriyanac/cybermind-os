import { Module } from '@nestjs/common';
import { KnowledgeGraphWorker } from './knowledge-graph.worker';

@Module({
  providers: [KnowledgeGraphWorker],
})
export class KnowledgeGraphModule {}
