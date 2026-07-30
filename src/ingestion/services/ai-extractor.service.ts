import { Injectable } from '@nestjs/common';
import { SmartRouterService } from '../../ai-gateway/router/smart-router.service';

@Injectable()
export class AiExtractorService {
  constructor(private readonly smartRouter: SmartRouterService) {}

  /**
   * Extracts a stable JSON schema from ingested content.
   */
  async extractEntities(content: string, source: string): Promise<any> {
    const systemPrompt = `You are a CTI Entity Extractor. Extract intelligence from the following ${source} data.
Return a JSON object matching this exact schema:
{
  "summary": "string",
  "entities": ["string"],
  "cves": ["string"],
  "malware": ["string"],
  "threatActors": ["string"],
  "ioc": ["string"],
  "mitreTechniques": ["string"],
  "products": ["string"],
  "vendors": ["string"],
  "campaigns": ["string"],
  "references": ["string"],
  "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
  "risk": "HIGH|MEDIUM|LOW",
  "confidence": number (0.0 to 1.0)
}
Do not use markdown blocks. Return only valid JSON.`;

    const result = await this.smartRouter.executeProvider({
      conversationId: 'ingestion-extraction',
      turnId: 'extraction-turn',
      provider: 'openai',
      modelKey: 'gpt-4o', // Usually top model is preferred for complex extraction
      systemPrompt,
      userPrompt: content.substring(0, 30000), // safeguard against context overflow
      onChunk: async () => {},
    });

    if (result.status !== 'SUCCESS') {
      throw new Error(`AI Extraction failed: ${result.errorMessage}`);
    }

    const jsonString = result.responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  }
}
