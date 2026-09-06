import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { AiGatewayService } from '../src/gateway/ai-gateway.service';
import { ConsensusEngine } from '../src/consensus/consensus-engine';
import { SemanticMemoryService } from '../src/memory/semantic-memory.service';
import { KnowledgeGraphService } from '../src/knowledge-graph/knowledge-graph.service';
import { PrismaService } from '../src/app/prisma.service';
import { KnowledgeCrawlerService } from '../src/crawler/knowledge-crawler.service';

describe('AI Gateway API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(KnowledgeCrawlerService)
      .useValue({
        crawl: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(PrismaService)
      .useValue({
        // mock any required methods here
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .overrideProvider(AiGatewayService)
      .useValue({
        createConversation: jest.fn().mockResolvedValue({ id: 'conv-123' }),
        getConversationMessages: jest.fn().mockResolvedValue([{ role: 'user', content: 'hello' }]),
        saveMessage: jest.fn().mockResolvedValue(undefined),
        complete: jest.fn().mockResolvedValue({ content: 'Mock response', provider: 'mock', modelKey: 'mock', inputTokens: 10, outputTokens: 20, latencyMs: 100 }),
        stream: jest.fn().mockImplementation(async function* () {
          yield { delta: 'chunk1', done: false };
          yield { delta: 'chunk2', done: true };
        }),
        getConversations: jest.fn().mockResolvedValue([{ id: 'conv-123', title: 'test' }]),
        getAvailableModels: jest.fn().mockReturnValue([{ id: 'model-1' }]),
      })
      .overrideProvider(ConsensusEngine)
      .useValue({
        query: jest.fn().mockResolvedValue({ result: 'consensus reached' }),
      })
      .overrideProvider(SemanticMemoryService)
      .useValue({
        search: jest.fn().mockResolvedValue(['memory 1']),
        summarizeAndStore: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(KnowledgeGraphService)
      .useValue({
        searchNodes: jest.fn().mockResolvedValue([{ id: 'node1', label: 'test' }]),
        getNeighbors: jest.fn().mockResolvedValue([{ id: 'node2', label: 'test2' }]),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Headers validation', () => {
    it('should reject missing tenant/user headers', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/ai/conversations')
        .expect(401);
    });
  });

  describe('/api/v1/ai/chat', () => {
    it('POST /api/v1/ai/chat - should process chat and return response', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ai/chat')
        .set('x-tenant-id', 'tenant-1')
        .set('x-user-id', 'user-1')
        .send({ message: 'Hello AI' })
        .expect(201);
      
      expect(response.body).toHaveProperty('content', 'Mock response');
      expect(response.body).toHaveProperty('conversationId', 'conv-123');
    });

    it('POST /api/v1/ai/chat - should reject empty message', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ai/chat')
        .set('x-tenant-id', 'tenant-1')
        .set('x-user-id', 'user-1')
        .send({ message: '   ' })
        .expect(400);
      
      expect(response.body.message).toBe('message is required');
    });
  });

  describe('Conversations', () => {
    it('GET /api/v1/ai/conversations', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ai/conversations')
        .set('x-tenant-id', 'tenant-1')
        .set('x-user-id', 'user-1')
        .expect(200);
      
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('id', 'conv-123');
    });

    it('GET /api/v1/ai/conversations/:id/messages', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ai/conversations/conv-123/messages')
        .set('x-tenant-id', 'tenant-1')
        .set('x-user-id', 'user-1')
        .expect(200);
      
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('role', 'user');
    });
  });

  describe('/api/v1/ai/chat/stream', () => {
    it('POST /api/v1/ai/chat/stream', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ai/chat/stream')
        .set('x-tenant-id', 'tenant-1')
        .set('x-user-id', 'user-1')
        .send({ message: 'stream test' })
        .expect(201); // Streams sometimes return 201 via POST in Nest without stream decorators, wait Nest streams return 201 by default unless Res is used. 
        // Our controller uses @Res() res: Response, so it actually might return 200 via res.write and not complete the response code automatically, but express handles it. Actually, the controller writes to res and calls res.end(). Let's accept whatever status it gives since we are just mocking.
    });
  });

  describe('Consensus & Knowledge', () => {
    it('POST /api/v1/ai/consensus', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ai/consensus')
        .set('x-tenant-id', 'tenant-1')
        .set('x-user-id', 'user-1')
        .send({ message: 'consensus test' })
        .expect(201);
      
      expect(response.body).toHaveProperty('result', 'consensus reached');
    });

    it('GET /api/v1/ai/knowledge/search', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ai/knowledge/search')
        .set('x-tenant-id', 'tenant-1')
        .set('x-user-id', 'user-1')
        .send({ query: 'test' })
        .expect(200);
      
      expect(response.body[0]).toHaveProperty('id', 'node1');
    });

    it('GET /api/v1/ai/knowledge/:id/neighbors', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ai/knowledge/node1/neighbors')
        .set('x-tenant-id', 'tenant-1')
        .set('x-user-id', 'user-1')
        .expect(200);
      
      expect(response.body[0]).toHaveProperty('id', 'node2');
    });
  });

  describe('Models & Health', () => {
    it('GET /api/v1/ai/models', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ai/models')
        .set('x-tenant-id', 'tenant-1')
        .expect(200);
      
      expect(response.body.models[0]).toHaveProperty('id', 'model-1');
    });

    it('GET /api/v1/ai/health', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ai/health')
        .expect(200);
      
      expect(response.body.status).toBe('ok');
    });
  });

  describe('CopilotController (/api/v1/ai/copilot)', () => {
    it('POST /api/v1/ai/copilot/explain-alert', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ai/copilot/explain-alert')
        .set('x-tenant-id', 'tenant-1')
        .set('x-user-id', 'user-1')
        .send({ alert: { id: 1 }, events: [] })
        .expect(201);
      
      expect(response.body).toHaveProperty('content', 'Mock response');
    });

    it('POST /api/v1/ai/copilot/summarize-case', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ai/copilot/summarize-case')
        .set('x-tenant-id', 'tenant-1')
        .set('x-user-id', 'user-1')
        .send({ investigationId: '123', evidence: [], notes: [] })
        .expect(201);
      
      expect(response.body).toHaveProperty('content', 'Mock response');
    });

    it('POST /api/v1/ai/copilot/mitigation-steps', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ai/copilot/mitigation-steps')
        .set('x-tenant-id', 'tenant-1')
        .set('x-user-id', 'user-1')
        .send({ alert: { id: 1 }, mitreTechniques: ['T1059'] })
        .expect(201);
      
      expect(response.body).toHaveProperty('content', 'Mock response');
    });

    it('POST /api/v1/ai/copilot/explain-rule', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ai/copilot/explain-rule')
        .set('x-tenant-id', 'tenant-1')
        .set('x-user-id', 'user-1')
        .send({ ruleContent: 'sigma logic here' })
        .expect(201);
      
      expect(response.body).toHaveProperty('content', 'Mock response');
    });

    it('POST /api/v1/ai/copilot/timeline', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ai/copilot/timeline')
        .set('x-tenant-id', 'tenant-1')
        .set('x-user-id', 'user-1')
        .send({ items: [] })
        .expect(201);
      
      expect(response.body).toHaveProperty('content', 'Mock response');
    });
  });
});
