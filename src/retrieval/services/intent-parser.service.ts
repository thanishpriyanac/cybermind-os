import { Injectable, Logger } from '@nestjs/common';
import { SmartRouterService } from '../../ai-gateway/router/smart-router.service';

export interface GraphIntent {
  entityType?: string;
  name?: string;
  relationship?: string;
  targetType?: string;
  limit: number;
  confidence: number;
  interpretedQuestion: string;
}

@Injectable()
export class IntentParserService {
  private readonly logger = new Logger(IntentParserService.name);

  constructor(private readonly smartRouter: SmartRouterService) {}

  async parseIntent(question: string): Promise<GraphIntent> {
    const prompt = `
      You are an expert Graph Query Intent Parser for a Cyber Threat Intelligence platform.
      Convert the following natural language question into a structured JSON graph intent object.
      Do not return anything other than valid JSON.
      
      Valid Entity Types: ThreatActor, Malware, Campaign, IPAddress, Domain, Vulnerability
      Valid Relationships: USES, TARGETS, COMMUNICATES_WITH, EXPLOITS
      
      Output Schema:
      {
        "entityType": "string (optional)",
        "name": "string (optional)",
        "relationship": "string (optional)",
        "targetType": "string (optional)",
        "limit": "number (default 50)",
        "interpretedQuestion": "string (how you interpreted their request)",
        "confidence": "number (0.0 to 1.0, your confidence in parsing this request)"
      }
      
      User Question: "${question}"
    `;

    try {
      // In production, this would use GPT-4o for high reasoning
      // const response = await this.smartRouter.routeRequest(prompt, { maxTokens: 300 });
      // const intent = JSON.parse(response);
      
      // Mocking the AI response for validation
      this.logger.log(`Parsing intent for: ${question}`);
      const intent: GraphIntent = {
        entityType: 'ThreatActor',
        name: 'APT29',
        relationship: 'USES',
        targetType: 'IPAddress',
        limit: 50,
        interpretedQuestion: 'Find all IP addresses used by ThreatActor APT29.',
        confidence: 0.95
      };
      
      return intent;
    } catch (error) {
      this.logger.error('Failed to parse intent', error);
      throw new Error('Could not parse graph query intent.');
    }
  }
}
