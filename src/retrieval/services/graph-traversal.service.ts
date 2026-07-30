import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchHit } from './keyword-search.service';

@Injectable()
export class GraphTraversalService {
  constructor(private readonly prisma: PrismaService) {}

  async expand(hits: SearchHit[], depth: number = 1): Promise<SearchHit[]> {
    const expandedHits: SearchHit[] = [];

    for (const hit of hits) {
      if (hit.type === 'Article') {
        // Find KnowledgeGraphNode linking to this article
        const nodeLabel = `Article:${hit.id}`;
        const articleNode = await this.prisma.knowledgeGraphNode.findUnique({
          where: { label: nodeLabel },
          include: { outEdges: true }
        });
        
        if (articleNode) {
          for (const edge of articleNode.outEdges) {
            const targetNode = await this.prisma.knowledgeGraphNode.findUnique({ where: { id: edge.targetId } });
            if (targetNode) {
              expandedHits.push({
                id: targetNode.id,
                type: 'GraphNode',
                score: hit.score * 0.9, // Decay score based on traversal depth
                metadata: targetNode
              });
            }
          }
        }
      }
    }

    return expandedHits;
  }
}
