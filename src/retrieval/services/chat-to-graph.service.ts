import { Injectable, Logger } from '@nestjs/common';
import { IntentParserService, GraphIntent } from './intent-parser.service';
import { GraphQueryBuilderService } from './graph-query-builder.service';

export interface ChatToGraphResponse {
  explanation: {
    interpretedQuestion: string;
    appliedFilters: Partial<GraphIntent>;
    traversalDepth: number;
    entitiesFound: number;
    aiInterpretationConfidence: number;
  };
  results: any[];
}

@Injectable()
export class ChatToGraphService {
  private readonly logger = new Logger(ChatToGraphService.name);

  constructor(
    private readonly intentParser: IntentParserService,
    private readonly queryBuilder: GraphQueryBuilderService
  ) {}

  async processNaturalLanguageQuery(question: string): Promise<ChatToGraphResponse> {
    this.logger.log(`Processing Chat-to-Graph query: "${question}"`);
    
    // 1. Parse intent
    const intent = await this.intentParser.parseIntent(question);
    
    // 2. Security / Validation (e.g., check for malicious prompts or unsupported logic)
    if (intent.confidence < 0.6) {
        throw new Error('Ambiguous query. Please rephrase your question.');
    }

    // 3. Execute safe constrained query
    const results = await this.queryBuilder.executeQuery(intent);
    
    // 4. Return results with full explainability metadata
    return {
      explanation: {
        interpretedQuestion: intent.interpretedQuestion,
        appliedFilters: {
            entityType: intent.entityType,
            name: intent.name,
            relationship: intent.relationship,
            targetType: intent.targetType
        },
        traversalDepth: intent.relationship ? 1 : 0, // Simplified depth for v1.1
        entitiesFound: results.length,
        aiInterpretationConfidence: intent.confidence
      },
      results
    };
  }
}
