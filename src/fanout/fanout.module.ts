import { Module } from '@nestjs/common';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';
import { ConsensusService } from './consensus.service';
import { FanOutOrchestratorService } from './fanout-orchestrator.service';
import { SseMultiplexerService } from './sse-multiplexer.service';
import { FanOutController } from './fanout.controller';

@Module({
  imports: [AiGatewayModule],
  controllers: [FanOutController],
  providers: [
    ConsensusService,
    FanOutOrchestratorService,
    SseMultiplexerService,
  ],
  exports: [FanOutOrchestratorService, ConsensusService, SseMultiplexerService],
})
export class FanOutModule {}
