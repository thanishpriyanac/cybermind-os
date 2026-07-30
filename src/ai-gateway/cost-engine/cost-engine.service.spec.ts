import { Test, TestingModule } from '@nestjs/testing';
import { CostEngineService } from './cost-engine.service';

describe('CostEngineService', () => {
  let service: CostEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CostEngineService],
    }).compile();

    service = module.get<CostEngineService>(CostEngineService);
  });

  it('should estimate token count accurately', () => {
    const sampleText = 'This is a test security prompt for token estimation.';
    const tokens = service.estimateTokenCount(sampleText);
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toEqual(Math.ceil(sampleText.length / 4));
  });

  it('should calculate USD cost correctly based on token rates', () => {
    // 1000 input tokens at $0.005/1k + 500 output tokens at $0.015/1k
    // Input = $0.005, Output = $0.0075 -> Total = $0.0125
    const cost = service.calculateCostUsd(1000, 500, 0.005, 0.015);
    expect(cost).toEqual(0.0125);
  });

  it('should return 0 cost for local models with 0 rates', () => {
    const cost = service.calculateCostUsd(5000, 2000, 0.0, 0.0);
    expect(cost).toEqual(0);
  });
});
