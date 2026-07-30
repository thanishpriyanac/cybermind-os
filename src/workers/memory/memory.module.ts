import { Module } from '@nestjs/common';
import { MemoryWorker } from './memory.worker';
import { AiGatewayModule } from '../../ai-gateway/ai-gateway.module';

@Module({
  imports: [AiGatewayModule],
  providers: [MemoryWorker],
})
export class MemoryModule {}
