import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DomainEventBusService } from '../../events/domain-event-bus.service';
import { DomainEvents } from '../../events/domain-events.registry';
import { randomUUID } from 'crypto';

@Injectable()
export class ReviewQueueService {
  private readonly logger = new Logger(ReviewQueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async evaluateNodeForReview(nodeId: string): Promise<void> {
    const node = await this.prisma.knowledgeGraphNode.findUnique({ where: { id: nodeId } });
    if (!node) return;

    let needsReview = false;
    let reason = '';
    let priority = 'LOW';

    // Rule 1: Low Confidence
    if (node.aiConfidence < 0.6) {
      needsReview = true;
      reason = 'Low AI Confidence';
    }

    // Rule 2: Conflicting Sources (mock check: if provenance array has multiple sources with wildly different confidences)
    if (Array.isArray(node.provenance) && node.provenance.length > 1) {
      needsReview = true;
      reason = 'Multiple Sources / Potential Conflict';
      priority = 'MEDIUM';
    }
    
    // Critical priority for Threat Actors / CVEs
    if (needsReview && (node.nodeType === 'CVE' || node.nodeType === 'ThreatActor')) {
        priority = 'HIGH';
    }

    if (needsReview) {
      await this.prisma.humanReviewTask.create({
        data: {
          entityId: node.id,
          entityType: 'Node',
          reason,
          priority
        }
      });
      
      await this.eventBus.publish({
          eventId: randomUUID(),
          eventType: DomainEvents.ReviewRequested,
          occurredAt: new Date().toISOString(),
          version: 1,
          correlationId: node.id,
          traceId: randomUUID(),
          source: 'ReviewQueueService',
          payload: { entityId: node.id, reason }
      });
      this.logger.log(`Queued Review Task for Node ${node.label}`);
    }
  }

  async resolveTask(taskId: string, analystId: string, resolution: 'APPROVED' | 'REJECTED' | 'ESCALATED', notes: string): Promise<void> {
    // Basic RBAC check would occur at controller level before reaching here.
    
    const task = await this.prisma.humanReviewTask.update({
      where: { id: taskId },
      data: {
        status: resolution,
        reviewedAt: new Date(),
        assignedTo: analystId,
        reviewNotes: notes,
        resolution
      }
    });

    if (resolution === 'APPROVED' && task.entityType === 'Node') {
      await this.prisma.knowledgeGraphNode.update({
        where: { id: task.entityId },
        data: { 
            humanVerified: true,
            humanConfidence: 1.0,
            lastVerified: new Date()
        }
      });
      
      await this.eventBus.publish({
          eventId: randomUUID(),
          eventType: DomainEvents.EntityVerified,
          occurredAt: new Date().toISOString(),
          version: 1,
          correlationId: task.entityId,
          traceId: randomUUID(),
          source: 'ReviewQueueService',
          payload: { entityId: task.entityId, analystId }
      });
    }

    await this.eventBus.publish({
      eventId: randomUUID(),
      eventType: DomainEvents.ReviewCompleted,
      occurredAt: new Date().toISOString(),
      version: 1,
      correlationId: taskId,
      traceId: randomUUID(),
      source: 'ReviewQueueService',
      payload: { taskId, resolution }
    });
  }
}
