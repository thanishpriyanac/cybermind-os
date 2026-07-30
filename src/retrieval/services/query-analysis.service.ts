import { Injectable } from '@nestjs/common';
import { SmartRouterService } from '../../ai-gateway/router/smart-router.service';

export interface QueryIntent {
  isKeywordHeavy: boolean;
  isSemantic: boolean;
  isGraphExploration: boolean;
  entities: string[];
}

@Injectable()
export class QueryAnalysisService {
  constructor(private readonly smartRouter: SmartRouterService) {}

  async analyzeQuery(query: string): Promise<QueryIntent> {
    // In a real implementation, we could use an LLM or local heuristic model to parse the query intent.
    // For now, we mock the analysis.
    
    // Example: "Find ransomware campaigns using T1059" -> semantic + graph
    const lowerQuery = query.toLowerCase();
    const isGraphExploration = lowerQuery.includes('linked to') || lowerQuery.includes('using');
    
    return {
      isKeywordHeavy: true, // We always want to run keyword as a baseline
      isSemantic: true,
      isGraphExploration,
      entities: [] // This could be populated by NER
    };
  }
}
