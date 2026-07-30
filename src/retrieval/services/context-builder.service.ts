import { Injectable } from '@nestjs/common';
import { SearchHit } from './keyword-search.service';

@Injectable()
export class ContextBuilderService {
  
  buildContext(hits: SearchHit[], modelContextLimit: number = 8000): string {
    let context = "--- RETRIEVED INTELLIGENCE ---\n\n";
    let estimatedTokens = 10; // rough estimate for header

    for (const hit of hits) {
      const itemText = this.formatHit(hit);
      const itemTokens = Math.ceil(itemText.length / 4); // rough approximation: 4 chars = 1 token

      if (estimatedTokens + itemTokens > modelContextLimit * 0.8) {
        // Reserve 20% for prompt/response
        context += `\n[Context truncated due to limits]`;
        break;
      }

      context += itemText + "\n\n";
      estimatedTokens += itemTokens;
    }

    return context;
  }

  private formatHit(hit: SearchHit): string {
    if (hit.type === 'Article') {
      const m = hit.metadata;
      return `[Article] ${m.title}\nSource: ${m.source} (Confidence: ${m.confidenceScore})\nPublished: ${m.publishedAt}\nContent:\n${m.content}`;
    } else {
      const m = hit.metadata;
      const provenanceStr = m.provenance ? JSON.stringify(m.provenance) : '[]';
      return `[Graph Node] ${m.label} (${m.nodeType})\nProvenance: ${provenanceStr}\nFirst Seen: ${m.firstSeen}`;
    }
  }
}
