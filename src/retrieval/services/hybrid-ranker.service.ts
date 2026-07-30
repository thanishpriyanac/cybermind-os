import { Injectable } from '@nestjs/common';
import { SearchHit } from './keyword-search.service';

export interface RankingConfig {
  semanticWeight: number;
  keywordWeight: number;
  graphWeight: number;
}

@Injectable()
export class HybridRankerService {
  
  // Default config per user's recommendation
  private config: RankingConfig = {
    semanticWeight: 0.45,
    keywordWeight: 0.30,
    graphWeight: 0.25,
  };

  rank(keywordHits: SearchHit[], vectorHits: SearchHit[], graphHits: SearchHit[]): SearchHit[] {
    const scoredMap = new Map<string, SearchHit>();

    const applyScore = (hits: SearchHit[], weight: number, matchType: string) => {
      for (const hit of hits) {
        const existing = scoredMap.get(hit.id);
        const weightedScore = hit.score * weight;
        
        if (existing) {
          existing.score += weightedScore;
          existing.matchedBy = existing.matchedBy || [];
          existing.matchedBy.push({ type: matchType, score: weightedScore });
        } else {
          scoredMap.set(hit.id, { 
            ...hit, 
            score: weightedScore, 
            matchedBy: [{ type: matchType, score: weightedScore }] 
          });
        }
      }
    };

    applyScore(keywordHits, this.config.keywordWeight, 'keyword');
    applyScore(vectorHits, this.config.semanticWeight, 'semantic');
    applyScore(graphHits, this.config.graphWeight, 'graph');

    const merged = Array.from(scoredMap.values());

    // Apply Freshness and Confidence bonuses
    for (const hit of merged) {
      hit.score += this.calculateConfidenceBonus(hit);
      hit.score += this.calculateFreshnessBonus(hit);
    }

    // Sort descending
    return merged.sort((a, b) => b.score - a.score);
  }

  private calculateConfidenceBonus(hit: SearchHit): number {
    if (hit.type === 'GraphNode' && hit.metadata?.provenance) {
      let maxConfidence = 0.5;
      for (const p of hit.metadata.provenance) {
        if (p.confidence > maxConfidence) maxConfidence = p.confidence;
      }
      return maxConfidence * 0.1; // Max 0.1 bonus
    }
    return hit.metadata?.confidenceScore ? hit.metadata.confidenceScore * 0.1 : 0;
  }

  private calculateFreshnessBonus(hit: SearchHit): number {
    const publishedAt = hit.metadata?.publishedAt || hit.metadata?.firstSeen;
    if (!publishedAt) return 0;

    const daysOld = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    // Simple decay: newer is better, max bonus 0.1
    const bonus = Math.max(0, 0.1 - (daysOld * 0.001));
    return bonus;
  }
}
