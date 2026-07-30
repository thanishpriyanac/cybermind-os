import { Controller, Post, Get, Body, Param, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { FanOutOrchestratorService } from './fanout-orchestrator.service';
import { SseMultiplexerService } from './sse-multiplexer.service';
import { CreateTurnDto } from './dto/fanout.dto';

@ApiTags('Conversations & Multi-Provider Fan-Out')
@Controller('conversations')
export class FanOutController {
  constructor(
    private readonly orchestrator: FanOutOrchestratorService,
    private readonly sseMultiplexer: SseMultiplexerService,
  ) {}

  @Post(':id/turns')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Submit query turn & dispatch multi-provider fan-out jobs' })
  @ApiResponse({ status: 202, description: 'Fan-out jobs dispatched; stream channel returned.' })
  async createTurn(@Param('id') conversationId: string, @Body() dto: CreateTurnDto) {
    return this.orchestrator.dispatchTurn(conversationId, dto);
  }

  @Get(':id/stream')
  @ApiOperation({ summary: 'SSE Stream Multiplexer Endpoint for real-time model responses' })
  async connectStream(@Param('id') conversationId: string, @Res() res: Response) {
    return this.sseMultiplexer.connectStream(conversationId, res);
  }
}
