import { Injectable } from '@nestjs/common';

@Injectable()
export class CostEngineService {
  /**
   * Estimates token count based on standard word/character ratio heuristics (~4 chars per token)
   */
  estimateTokenCount(text: string): number {
    if (!text || text.length === 0) return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculates total USD cost based on model input/output rates per 1,000 tokens
   */
  calculateCostUsd(
    promptTokens: number,
    completionTokens: number,
    costPerInput1k: number,
    costPerOutput1k: number,
  ): number {
    const inputCost = (promptTokens / 1000) * costPerInput1k;
    const outputCost = (completionTokens / 1000) * costPerOutput1k;
    const total = inputCost + outputCost;

    // Round to 6 decimal places
    return Math.round(total * 1000000) / 1000000;
  }
}
