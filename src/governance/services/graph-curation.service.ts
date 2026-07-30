import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DomainEventBusService } from '../../events/domain-event-bus.service';
import { DomainEvents } from '../../events/domain-events.registry';
import { randomUUID } from 'crypto';

@Injectable()
export class GraphCurationService {
  private readonly logger = new Logger(GraphCurationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async mergeNodes(canonicalNodeId: string, aliasNodeId: string, keepAsAlias: boolean = true): Promise<void> {
    const canonical = await this.prisma.knowledgeGraphNode.findUnique({ where: { id: canonicalNodeId } });
    const alias = await this.prisma.knowledgeGraphNode.findUnique({ where: { id: aliasNodeId } });

    if (!canonical || !alias) {
      throw new Error("One or both nodes not found for merging.");
    }

    // 1. Move all Outbound edges from alias to canonical
    await this.prisma.knowledgeGraphEdge.updateMany({
      where: { sourceId: aliasNodeId },
      data: { sourceId: canonicalNodeId }
    });

    // 2. Move all Inbound edges from alias to canonical
    await this.prisma.knowledgeGraphEdge.updateMany({
      where: { targetId: aliasNodeId },
      data: { targetId: canonicalNodeId }
    });

    // 3. Handle the alias node itself
    if (keepAsAlias) {
      await this.prisma.knowledgeGraphNode.update({
        where: { id: aliasNodeId },
        data: {
          isAlias: true,
          canonicalId: canonicalNodeId,
          lastVerified: new Date()
        }
      });
      this.logger.log(`Merged ${alias.label} into ${canonical.label} (Kept as Alias)`);
    } else {
      await this.prisma.knowledgeGraphNode.delete({ where: { id: aliasNodeId } });
      this.logger.log(`Merged and deleted ${alias.label} into ${canonical.label}`);
    }

    await this.eventBus.publish({
        eventId: randomUUID(),
        eventType: DomainEvents.EntityMerged,
        occurredAt: new Date().toISOString(),
        version: 1,
        correlationId: canonicalNodeId,
        traceId: randomUUID(),
        source: 'GraphCurationService',
        payload: { canonicalNodeId, aliasNodeId, keptAsAlias: keepAsAlias }
    });
  }

  async adjustConfidence(nodeId: string, newConfidence: number): Promise<void> {
    await this.prisma.knowledgeGraphNode.update({
      where: { id: nodeId },
      data: { humanConfidence: newConfidence, lastVerified: new Date() }
    });

    await this.eventBus.publish({
        eventId: randomUUID(),
        eventType: DomainEvents.ConfidenceAdjusted,
        occurredAt: new Date().toISOString(),
        version: 1,
        correlationId: nodeId,
        traceId: randomUUID(),
        source: 'GraphCurationService',
        payload: { nodeId, newConfidence }
    });
  }
}
