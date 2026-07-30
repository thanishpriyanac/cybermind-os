import { Provider } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { SmartRouterService } from '../ai-gateway/router/smart-router.service';

export const mockPrismaService = {
  knowledgeGraphNode: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), upsert: jest.fn() },
  knowledgeGraphEdge: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  humanReviewTask: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  providerConfiguration: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), upsert: jest.fn() },
  cyberArticle: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  $transaction: jest.fn().mockImplementation(async (cb) => cb(mockPrismaService)),
};

export const MockPrismaProvider: Provider = {
  provide: PrismaService,
  useValue: mockPrismaService,
};

export const mockEventBusService = {
  publish: jest.fn(),
  subscribe: jest.fn(),
};

export const MockEventBusProvider: Provider = {
  provide: DomainEventBusService,
  useValue: mockEventBusService,
};

export const mockSmartRouterService = {
  routeRequest: jest.fn(),
  generateEmbedding: jest.fn(),
};

export const MockSmartRouterProvider: Provider = {
  provide: SmartRouterService,
  useValue: mockSmartRouterService,
};

export const mockQueue = {
  add: jest.fn(),
  process: jest.fn(),
  on: jest.fn(),
};

export const getMockQueueProvider = (queueName: string): Provider => ({
  provide: `BullQueue_${queueName}`,
  useValue: mockQueue,
});
