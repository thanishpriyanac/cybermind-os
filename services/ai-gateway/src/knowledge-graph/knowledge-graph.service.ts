import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../app/prisma.service';
import { EmbeddingProvider } from '../providers/provider.interface';

export type NodeType = 'THREAT_ACTOR' | 'CVE' | 'MALWARE' | 'MITRE_TECHNIQUE' | 'IOC' | 'CAMPAIGN';
export type Relationship = 'EXPLOITS' | 'TARGETS' | 'USES_MALWARE' | 'MITIGATES' | 'ATTRIBUTED_TO' | 'LINKED_TO';

@Injectable()
export class KnowledgeGraphService {
  private readonly logger = new Logger(KnowledgeGraphService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingProvider: EmbeddingProvider,
  ) {}

  async upsertNode(label: string, nodeType: NodeType, properties: Record<string, any> = {}, tenantId = 'GLOBAL') {
    const existing = await this.prisma.knowledgeGraphNode.findFirst({
      where: { label, nodeType, tenantId },
    });

    if (existing) return existing;

    // Embed the label for semantic search
    const [embedding] = await this.embeddingProvider.embed([`${nodeType}: ${label}`]);

    return this.prisma.$executeRaw`
      INSERT INTO "KnowledgeGraphNode" ("id", "tenantId", "label", "nodeType", "properties", "embedding", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(), ${tenantId}, ${label}, ${nodeType},
        ${JSON.stringify(properties)}::jsonb,
        ${`[${embedding.join(',')}]`}::vector,
        now(), now()
      )
      ON CONFLICT DO NOTHING
    `;
  }

  async linkNodes(sourceLabel: string, targetLabel: string, relationship: Relationship, weight = 1.0) {
    const source = await this.prisma.knowledgeGraphNode.findFirst({ where: { label: sourceLabel } });
    const target = await this.prisma.knowledgeGraphNode.findFirst({ where: { label: targetLabel } });

    if (!source || !target) {
      this.logger.warn(`Cannot link ${sourceLabel} → ${targetLabel}: node not found`);
      return;
    }

    await this.prisma.knowledgeGraphEdge.upsert({
      where: { sourceId_targetId_relationship: { sourceId: source.id, targetId: target.id, relationship } },
      create: { sourceId: source.id, targetId: target.id, relationship, weight },
      update: { weight },
    });
  }

  async searchNodes(query: string, nodeType?: NodeType, topK = 10) {
    const [embedding] = await this.embeddingProvider.embed([query]);
    const vectorLiteral = `[${embedding.join(',')}]`;

    return this.prisma.$queryRaw<{ id: string; label: string; nodeType: string; properties: any; distance: number }[]>`
      SELECT id, label, "nodeType", properties, embedding <-> ${vectorLiteral}::vector AS distance
      FROM "KnowledgeGraphNode"
      WHERE (${nodeType ?? null}::text IS NULL OR "nodeType" = ${nodeType ?? ''})
      ORDER BY distance ASC
      LIMIT ${topK}
    `;
  }

  async getNeighbors(nodeId: string) {
    const outgoing = await this.prisma.knowledgeGraphEdge.findMany({
      where: { sourceId: nodeId },
      include: { targetNode: true },
    });
    const incoming = await this.prisma.knowledgeGraphEdge.findMany({
      where: { targetId: nodeId },
      include: { sourceNode: true },
    });
    return { outgoing, incoming };
  }
}
