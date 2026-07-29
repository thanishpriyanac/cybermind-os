import {
  Controller, Post, Get, Body, Headers, Param, Res,
  UnauthorizedException, BadRequestException, Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AiGatewayService } from '../gateway/ai-gateway.service';
import { ConsensusEngine } from '../consensus/consensus-engine';
import { SemanticMemoryService } from '../memory/semantic-memory.service';
import { KnowledgeGraphService } from '../knowledge-graph/knowledge-graph.service';
import { PrismaService } from './prisma.service';

@Controller('v1/ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly gateway: AiGatewayService,
    private readonly consensus: ConsensusEngine,
    private readonly memory: SemanticMemoryService,
    private readonly knowledgeGraph: KnowledgeGraphService,
    private readonly prisma: PrismaService,
  ) {}

  /** POST /api/v1/ai/chat — standard completion */
  @Post('chat')
  async chat(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: { conversationId?: string; message: string; modelKey?: string },
  ) {
    this.requireHeaders(tenantId, userId);
    if (!body.message?.trim()) throw new BadRequestException('message is required');

    // Retrieve relevant memories
    const memories = await this.memory.search(tenantId, body.message, 3);
    const memoryContext = memories.length
      ? `\n\nRelevant context from memory:\n${memories.join('\n---\n')}`
      : '';

    const systemPrompt = `You are CYBERMIND AI — an expert cybersecurity intelligence analyst.
Analyze security data, investigate threats, and provide actionable recommendations.
Use MITRE ATT&CK, CVE databases, and threat intelligence in your reasoning.${memoryContext}`;

    const response = await this.gateway.complete(tenantId, userId, {
      modelKey: body.modelKey ?? 'auto',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: body.message },
      ],
    });

    // Store conversation & memory asynchronously
    if (body.conversationId) {
      this.memory.summarizeAndStore(body.conversationId, tenantId, [
        { role: 'user', content: body.message },
        { role: 'assistant', content: response.content },
      ]).catch(() => {});
    }

    return response;
  }

  /** POST /api/v1/ai/chat/stream — SSE streaming */
  @Post('chat/stream')
  async chatStream(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: { message: string; modelKey?: string },
    @Res() res: Response,
  ) {
    this.requireHeaders(tenantId, userId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const generator = this.gateway.stream(tenantId, userId, {
        modelKey: body.modelKey ?? 'auto',
        messages: [
          { role: 'system', content: 'You are CYBERMIND AI — an expert cybersecurity analyst.' },
          { role: 'user', content: body.message },
        ],
      });

      for await (const chunk of generator) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        if (chunk.done) break;
      }
    } catch (e: any) {
      res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    } finally {
      res.end();
    }
  }

  /** POST /api/v1/ai/consensus — multi-model fan-out */
  @Post('consensus')
  async consensus_query(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: { message: string },
  ) {
    this.requireHeaders(tenantId, userId);
    return this.consensus.query(tenantId, userId, {
      modelKey: 'auto',
      messages: [
        { role: 'system', content: 'You are an expert cybersecurity analyst. Be precise and concise.' },
        { role: 'user', content: body.message },
      ],
    });
  }

  /** GET /api/v1/ai/knowledge/search?q= — semantic knowledge search */
  @Get('knowledge/search')
  async searchKnowledge(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: { query: string; nodeType?: string },
  ) {
    this.requireHeaders(tenantId, userId);
    return this.knowledgeGraph.searchNodes(body.query, body.nodeType as any);
  }

  /** GET /api/v1/ai/knowledge/:id/neighbors */
  @Get('knowledge/:id/neighbors')
  async getNeighbors(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id') nodeId: string,
  ) {
    this.requireHeaders(tenantId, userId);
    return this.knowledgeGraph.getNeighbors(nodeId);
  }

  /** GET /api/v1/ai/models — list available models */
  @Get('models')
  async listModels(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId?.trim()) throw new UnauthorizedException('x-tenant-id required');
    return { models: this.gateway.getAvailableModels() };
  }

  @Get('health')
  async getHealth() {
    return { status: 'ok', service: 'ai-gateway', timestamp: new Date().toISOString() };
  }

  private requireHeaders(tenantId: string, userId: string) {
    if (!tenantId?.trim()) throw new UnauthorizedException('x-tenant-id is required');
    if (!userId?.trim()) throw new UnauthorizedException('x-user-id is required');
  }
}
