import { Test, TestingModule } from '@nestjs/testing';
import { CircuitBreakerService } from './circuit-breaker.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      providerHealthEvent: {
        create: jest.fn().mockResolvedValue({}),
      },
      providerModel: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CircuitBreakerService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<CircuitBreakerService>(CircuitBreakerService);
  });

  it('should allow execution when circuit is ONLINE', () => {
    expect(service.canExecute('gpt-4o')).toBe(true);
  });

  it('should open circuit after 3 consecutive failures and block execution', async () => {
    const model = 'gpt-4o';
    await service.recordFailure('openai', model, 'Timeout 1');
    expect(service.canExecute(model)).toBe(true);

    await service.recordFailure('openai', model, 'Timeout 2');
    expect(service.canExecute(model)).toBe(true);

    await service.recordFailure('openai', model, 'Timeout 3');
    // 3 failures hit -> circuit should be OPEN
    expect(service.canExecute(model)).toBe(false);
    expect(prismaService.providerHealthEvent.create).toHaveBeenCalled();
  });

  it('should reset failure count on success', async () => {
    const model = 'gpt-4o';
    await service.recordFailure('openai', model, 'Timeout 1');
    await service.recordSuccess('openai', model);
    expect(service.canExecute(model)).toBe(true);
  });
});
