import { Injectable, Logger } from '@nestjs/common';
import { AiGatewayService } from '../gateway/ai-gateway.service';
import { LlmRequest, LlmResponse } from '../providers/provider.interface';

export interface ConsensusResult {
  responses: { model: string; content: string; latencyMs: number; costUsd: number }[];
  consensus: string;
  agreementScore: number; // 0–1
}

const CONSENSUS_MODELS: string[] = [
  'gpt-4o',
  'claude-3-5-sonnet-20241022',
  'llama3.1',
];

@Injectable()
export class ConsensusEngine {
  private readonly logger = new Logger(ConsensusEngine.name);

  constructor(private readonly gateway: AiGatewayService) {}

  /**
   * Fan out the same request to multiple models in parallel, then
   * synthesize a consensus response by comparing outputs.
   */
  async query(tenantId: string, userId: string, baseRequest: LlmRequest): Promise<ConsensusResult> {
    const results = await Promise.allSettled(
      CONSENSUS_MODELS.map(modelKey =>
        this.gateway.complete(tenantId, userId, { ...baseRequest, modelKey })
      )
    );

    const responses = results
      .filter((r): r is PromiseFulfilledResult<LlmResponse> => r.status === 'fulfilled')
      .map(r => ({
        model: r.value.modelKey,
        content: r.value.content,
        latencyMs: r.value.latencyMs,
        costUsd: r.value.costUsd,
      }));

    if (responses.length === 0) throw new Error('All consensus models failed');

    const consensus = this.synthesize(responses.map(r => r.content));
    const agreementScore = this.calculateAgreement(responses.map(r => r.content));

    this.logger.log(`Consensus complete: ${responses.length} models, agreement=${agreementScore.toFixed(2)}`);

    return { responses, consensus, agreementScore };
  }

  /**
   * Simple consensus: pick the longest response as primary, annotate with divergence.
   * Sprint 2 will use a dedicated synthesizer model.
   */
  private synthesize(contents: string[]): string {
    if (contents.length === 1) return contents[0];
    const sorted = [...contents].sort((a, b) => b.length - a.length);
    return sorted[0]; // longest response as primary for now
  }

  /**
   * Agreement score based on common bigrams across responses.
   */
  private calculateAgreement(contents: string[]): number {
    if (contents.length < 2) return 1.0;
    const bigramSets = contents.map(c => this.bigrams(c.toLowerCase().slice(0, 500)));
    let totalOverlap = 0;
    let totalUnion = 0;
    for (let i = 0; i < bigramSets.length - 1; i++) {
      const a = bigramSets[i];
      const b = bigramSets[i + 1];
      const intersection = new Set([...a].filter(x => b.has(x)));
      const union = new Set([...a, ...b]);
      totalOverlap += intersection.size;
      totalUnion += union.size;
    }
    return totalUnion === 0 ? 0 : totalOverlap / totalUnion;
  }

  private bigrams(text: string): Set<string> {
    const words = text.split(/\s+/);
    const bg = new Set<string>();
    for (let i = 0; i < words.length - 1; i++) bg.add(`${words[i]} ${words[i + 1]}`);
    return bg;
  }
}
