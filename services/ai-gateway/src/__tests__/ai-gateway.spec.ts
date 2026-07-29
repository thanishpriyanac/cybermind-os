import { SmartProviderRouter } from '../gateway/smart-router';
import { AiGatewayService } from '../gateway/ai-gateway.service';
import { ConsensusEngine } from '../consensus/consensus-engine';
import { LlmProvider, LlmRequest, LlmResponse } from '../providers/provider.interface';

const makeMockProvider = (name: string, models: string[], content = 'mock response'): LlmProvider => ({
  name,
  supportedModels: models,
  complete: jest.fn().mockResolvedValue({
    content, provider: name, modelKey: models[0],
    inputTokens: 100, outputTokens: 50, latencyMs: 200, costUsd: 0.001,
  } as LlmResponse),
  stream: async function* () { yield { delta: content, done: true }; },
  isHealthy: jest.fn().mockResolvedValue(true),
});

const mockPrisma = { aiAuditLog: { create: jest.fn().mockResolvedValue({}) } } as any;

describe('SmartProviderRouter', () => {
  let router: SmartProviderRouter;
  const openaiProvider = makeMockProvider('openai', ['gpt-4o', 'gpt-4o-mini']);
  const ollamaProvider = makeMockProvider('ollama', ['llama3.1', 'qwen2.5-coder']);

  beforeEach(() => {
    const map = new Map<string, LlmProvider>([
      ['openai', openaiProvider],
      ['ollama', ollamaProvider],
    ]);
    router = new SmartProviderRouter(map);
  });

  it('should route PowerShell queries to qwen2.5-coder (local)', () => {
    const result = router.route({
      modelKey: 'auto',
      messages: [{ role: 'user', content: 'Analyze this PowerShell script for malicious indicators' }],
    });
    expect(result.modelKey).toBe('qwen2.5-coder');
    expect(result.provider.name).toBe('ollama');
  });

  it('should route CVE queries to claude-3-5-haiku (or fallback)', () => {
    const result = router.route({
      modelKey: 'auto',
      messages: [{ role: 'user', content: 'What is CVE-2024-3094?' }],
    });
    // claude not in map, so fallback to openai models
    expect(result.provider.name).toBe('openai');
  });

  it('should use explicit model when specified', () => {
    const result = router.route({ modelKey: 'gpt-4o', messages: [] });
    expect(result.modelKey).toBe('gpt-4o');
  });

  it('should fall back to llama3.1 for general queries', () => {
    const result = router.route({
      modelKey: 'auto',
      messages: [{ role: 'user', content: 'Explain zero trust networking' }],
    });
    expect(result.modelKey).toBe('llama3.1');
  });

  it('should list all available models from all providers', () => {
    const models = router.getAvailableModels();
    expect(models).toContain('gpt-4o');
    expect(models).toContain('llama3.1');
  });
});

describe('AiGatewayService', () => {
  let gateway: AiGatewayService;
  const ollamaProvider = makeMockProvider('ollama', ['llama3.1']);

  beforeEach(() => {
    const map = new Map<string, LlmProvider>([['ollama', ollamaProvider]]);
    const router = new SmartProviderRouter(map);
    gateway = new AiGatewayService(router, mockPrisma);
    jest.clearAllMocks();
  });

  it('should complete a request and return a response', async () => {
    const result = await gateway.complete('tenant-alpha', 'user-001', {
      modelKey: 'llama3.1',
      messages: [{ role: 'user', content: 'What is SQL injection?' }],
    });
    expect(result.content).toBe('mock response');
    expect(result.provider).toBe('ollama');
  });

  it('should reject after rate limit is exceeded', async () => {
    // Exhaust rate limit (60 RPM default)
    for (let i = 0; i < 60; i++) {
      await gateway.complete('tenant-ratelimit', 'user-001', {
        modelKey: 'llama3.1', messages: [{ role: 'user', content: 'test' }],
      }).catch(() => {});
    }
    await expect(
      gateway.complete('tenant-ratelimit', 'user-001', {
        modelKey: 'llama3.1', messages: [{ role: 'user', content: 'test' }],
      })
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('should write an audit log entry on completion', async () => {
    await gateway.complete('tenant-alpha', 'user-001', {
      modelKey: 'llama3.1',
      messages: [{ role: 'user', content: 'test' }],
    });
    expect(mockPrisma.aiAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenantId: 'tenant-alpha' }) })
    );
  });
});
