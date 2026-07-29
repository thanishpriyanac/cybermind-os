import { Injectable, Logger } from '@nestjs/common';
import { LlmRequest, LlmResponse, LlmStreamChunk } from '../providers/provider.interface';
import { SmartProviderRouter } from './smart-router';
import { PrismaService } from '../app/prisma.service';

const DEFAULT_MONTHLY_BUDGET_USD = parseFloat(process.env.AI_MONTHLY_BUDGET_USD ?? '100');
const RATE_LIMIT_RPM = parseInt(process.env.AI_RATE_LIMIT_RPM ?? '60', 10);
const CIRCUIT_OPEN_FAILURES = 5;
const CIRCUIT_RESET_MS = 30_000;

interface CircuitState {
  failures: number;
  openUntil?: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);
  private readonly circuits = new Map<string, CircuitState>();
  private readonly rateBuckets = new Map<string, RateLimitBucket>();
  private readonly monthlySpend = new Map<string, number>(); // tenantId → USD

  constructor(
    private readonly router: SmartProviderRouter,
    private readonly prisma: PrismaService,
  ) {}

  async complete(tenantId: string, userId: string, request: LlmRequest): Promise<LlmResponse> {
    this.enforceRateLimit(tenantId);
    await this.enforceBudget(tenantId);

    const { modelKey, provider } = this.router.route(request);
    this.checkCircuit(provider.name);

    try {
      const response = await provider.complete({ ...request, modelKey });
      this.recordSuccess(provider.name);
      await this.recordUsage(tenantId, userId, response, 'QUERY');
      this.accumulateSpend(tenantId, response.costUsd);
      return response;
    } catch (error: any) {
      this.recordFailure(provider.name);
      throw error;
    }
  }

  async *stream(tenantId: string, userId: string, request: LlmRequest): AsyncGenerator<LlmStreamChunk> {
    this.enforceRateLimit(tenantId);
    await this.enforceBudget(tenantId);

    const { modelKey, provider } = this.router.route(request);
    this.checkCircuit(provider.name);

    try {
      yield* provider.stream({ ...request, modelKey });
      this.recordSuccess(provider.name);
    } catch (error: any) {
      this.recordFailure(provider.name);
      throw error;
    }
  }

  // ── Rate Limiting ──────────────────────────────────────────────────────────

  private enforceRateLimit(tenantId: string) {
    const now = Date.now();
    const bucket = this.rateBuckets.get(tenantId);

    if (!bucket || now > bucket.resetAt) {
      this.rateBuckets.set(tenantId, { count: 1, resetAt: now + 60_000 });
      return;
    }

    if (bucket.count >= RATE_LIMIT_RPM) {
      throw new Error(`Rate limit exceeded for tenant ${tenantId}. Retry after ${new Date(bucket.resetAt).toISOString()}`);
    }

    bucket.count++;
  }

  // ── Budget Guard ────────────────────────────────────────────────────────────

  private async enforceBudget(tenantId: string) {
    const spent = this.monthlySpend.get(tenantId) ?? 0;
    if (spent >= DEFAULT_MONTHLY_BUDGET_USD) {
      throw new Error(`Monthly AI budget ($${DEFAULT_MONTHLY_BUDGET_USD}) exhausted for tenant ${tenantId}`);
    }
  }

  private accumulateSpend(tenantId: string, costUsd: number) {
    const current = this.monthlySpend.get(tenantId) ?? 0;
    this.monthlySpend.set(tenantId, current + costUsd);
  }

  // ── Circuit Breaker ─────────────────────────────────────────────────────────

  private checkCircuit(providerName: string) {
    const state = this.circuits.get(providerName);
    if (state?.openUntil && Date.now() < state.openUntil) {
      throw new Error(`Provider ${providerName} circuit breaker is OPEN. Retry after ${new Date(state.openUntil).toISOString()}`);
    }
  }

  private recordSuccess(providerName: string) {
    this.circuits.delete(providerName);
  }

  private recordFailure(providerName: string) {
    const state = this.circuits.get(providerName) ?? { failures: 0 };
    state.failures++;
    if (state.failures >= CIRCUIT_OPEN_FAILURES) {
      state.openUntil = Date.now() + CIRCUIT_RESET_MS;
      this.logger.error(`Circuit breaker OPEN for provider: ${providerName}`);
    }
    this.circuits.set(providerName, state);
  }

  // ── Audit Logging ──────────────────────────────────────────────────────────

  private async recordUsage(tenantId: string, userId: string, response: LlmResponse, action: string) {
    await this.prisma.aiAuditLog.create({
      data: {
        tenantId, userId, action,
        modelKey: response.modelKey,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        costUsd: response.costUsd,
        latencyMs: response.latencyMs,
      },
    }).catch(e => this.logger.warn(`Audit log write failed: ${e.message}`));
  }

  getAvailableModels() {
    return this.router.getAvailableModels();
  }
}
