import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, DynamicModule } from '@nestjs/common';
import request from 'supertest';

// Mock Event Platform
@Module({})
class MockEventPlatformModule {
  static forRoot(): DynamicModule {
    return {
      module: MockEventPlatformModule,
      providers: [],
      exports: [],
    };
  }
}

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    asset: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    assetRelationship: { create: jest.fn(), findMany: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

import { AppModule } from '../src/app/app.module';
import { AssetDomainService } from '../src/domain/services/asset.domain.service';
import { EventPlatformModule, CybermindKafkaPublisher } from '@cybermind-os/event-client';

describe('Asset API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(EventPlatformModule)
      .useModule(MockEventPlatformModule)
      .overrideProvider(CybermindKafkaPublisher)
      .useValue({
        publish: jest.fn().mockResolvedValue(undefined),
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(AssetDomainService)
      .useValue({
        createAsset: jest.fn().mockResolvedValue({ id: 'mock-asset-1', name: 'Server A' }),
        getAsset: jest.fn().mockImplementation((tenantId, id) => {
          if (id === 'mock-asset-1') return Promise.resolve({ id: 'mock-asset-1', name: 'Server A', tenantId });
          return Promise.resolve(null);
        }),
        addRelationship: jest.fn().mockResolvedValue({ id: 'rel-1', sourceAssetId: 'mock-asset-1', targetAssetId: 'mock-asset-2' }),
        getRelationships: jest.fn().mockResolvedValue([{ id: 'rel-1' }]),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/assets', () => {
    it('POST /api/assets - Create Asset', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/assets')
        .set('x-tenant-id', 'tenant123')
        .set('x-user-id', 'user123')
        .send({
          name: 'Server A',
          type: 'host'
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id', 'mock-asset-1');
      expect(response.body).toHaveProperty('name', 'Server A');
    });

    it('GET /api/assets/:id - Get Asset', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/assets/mock-asset-1')
        .set('x-tenant-id', 'tenant123')
        .expect(200);
      
      expect(response.body).toHaveProperty('id', 'mock-asset-1');
      expect(response.body).toHaveProperty('name', 'Server A');
      expect(response.body).toHaveProperty('tenantId', 'tenant123');
    });

    it('POST /api/assets/:id/relationships - Add Relationship', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/assets/mock-asset-1/relationships')
        .set('x-tenant-id', 'tenant123')
        .set('x-user-id', 'user123')
        .send({
          targetAssetId: 'mock-asset-2',
          type: 'CONNECTS_TO'
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id', 'rel-1');
    });

    it('GET /api/assets/:id/relationships - Get Relationships', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/assets/mock-asset-1/relationships')
        .set('x-tenant-id', 'tenant123')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
    });
  });
});
