import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DomainWorker } from '../../events/domain-worker.interface';
import { DomainEvent } from '../../events/domain-event.interface';
import { DomainEvents } from '../../events/domain-events.registry';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('domain.kg', {
  concurrency: 5,
})
export class KnowledgeGraphWorker extends WorkerHost implements DomainWorker {
  private readonly logger = new Logger(KnowledgeGraphWorker.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  workerName(): string {
    return 'KnowledgeGraphWorker';
  }

  supports(eventType: string): boolean {
    return eventType === DomainEvents.EntityExtracted || 
           eventType === DomainEvents.ArticleIngested ||
           eventType === DomainEvents.FileUploaded ||
           eventType === DomainEvents.IocExtracted;
  }

  async process(job: Job<DomainEvent<any>>): Promise<void> {
    const event = job.data;
    
    // 60s timeout for KG updates
    await Promise.race([
      this.processEvent(event),
      new Promise((_, reject) => setTimeout(() => reject(new Error('KnowledgeGraphWorker Timeout')), 60000)),
    ]);
  }

  async processEvent(event: DomainEvent<any>): Promise<void> {
    if (!this.supports(event.eventType)) {
      return;
    }

    try {
      const payload = event.payload;
      if (!payload) return;

      // Handle Sandbox Events
      if (event.eventType === DomainEvents.FileUploaded) {
        const { fileId, originalName } = payload;
        await this.prisma.knowledgeGraphNode.upsert({
          where: { label: `File:${fileId}` },
          update: {},
          create: {
            label: `File:${fileId}`,
            nodeType: 'File',
            properties: { originalName },
            provenance: [{ source: 'Sandbox', confidence: 1.0, lastUpdated: new Date().toISOString() }],
            firstSeen: new Date(),
            lastVerified: new Date()
          }
        });
        this.logger.log(`[${this.workerName()}] Created File node for ${fileId}`);
        return;
      }

      if (event.eventType === DomainEvents.IocExtracted) {
        const { fileId, iocs } = payload;
        const fileNode = await this.prisma.knowledgeGraphNode.findUnique({ where: { label: `File:${fileId}` } });
        
        if (fileNode && Array.isArray(iocs)) {
          for (const ioc of iocs) {
            const iocLabel = `${ioc.type}:${ioc.value}`;
            
            await this.prisma.knowledgeGraphNode.upsert({
              where: { label: iocLabel },
              update: { lastVerified: new Date() },
              create: {
                label: iocLabel,
                nodeType: ioc.type,
                provenance: [{ source: 'Sandbox_Extraction', confidence: 0.9, lastUpdated: new Date().toISOString() }],
                firstSeen: new Date(),
                lastVerified: new Date()
              }
            });

            const targetNode = await this.prisma.knowledgeGraphNode.findUnique({ where: { label: iocLabel } });
            
            if (targetNode) {
              const edgeExists = await this.prisma.knowledgeGraphEdge.findFirst({
                where: { sourceId: fileNode.id, targetId: targetNode.id }
              });

              if (!edgeExists) {
                await this.prisma.knowledgeGraphEdge.create({
                  data: {
                    sourceId: fileNode.id,
                    targetId: targetNode.id,
                    relationship: 'CONTAINS_IOC',
                  }
                });
              }
            }
          }
        }
        this.logger.log(`[${this.workerName()}] Linked IOCs to File node ${fileId}`);
        return;
      }

      const extractedData = payload.extractedData;
      if (!extractedData) return;

      const { entities, technologies, malware, cves, mitre, ioc, threatActors, vendors, products } = extractedData;
      
      const allNodes: { label: string, type: string }[] = [];
      
      if (Array.isArray(entities)) entities.forEach(e => allNodes.push({ label: e, type: 'Entity' }));
      if (Array.isArray(technologies)) technologies.forEach(e => allNodes.push({ label: e, type: 'Technology' }));
      if (Array.isArray(malware)) malware.forEach(e => allNodes.push({ label: e, type: 'Malware' }));
      if (Array.isArray(cves)) cves.forEach(e => allNodes.push({ label: e, type: 'CVE' }));
      if (Array.isArray(mitre)) mitre.forEach(e => allNodes.push({ label: e, type: 'MITRE' }));
      if (Array.isArray(ioc)) ioc.forEach(e => allNodes.push({ label: e, type: 'IOC' }));
      if (Array.isArray(threatActors)) threatActors.forEach(e => allNodes.push({ label: e, type: 'ThreatActor' }));
      if (Array.isArray(vendors)) vendors.forEach(e => allNodes.push({ label: e, type: 'Vendor' }));
      if (Array.isArray(products)) products.forEach(e => allNodes.push({ label: e, type: 'Product' }));

      // Graph Node Merging & Source Provenance Logic
      const sourceName = event.source || 'Unknown';
      const sourceConfidence = payload.extractedData?.confidence || 1.0;
      const documentId = payload.articleId || event.conversationId || 'unknown';

      const newProvenanceEntry = {
        source: sourceName,
        confidence: sourceConfidence,
        lastUpdated: new Date().toISOString(),
        documentId: documentId,
        version: '1.0'
      };

      for (const node of allNodes) {
        // Look for existing node
        const existingNode = await this.prisma.knowledgeGraphNode.findUnique({
          where: { label: node.label }
        });

        if (existingNode) {
          const currentProvenance = Array.isArray(existingNode.provenance) ? existingNode.provenance : [];
          
          // Check if this source already exists in provenance
          const existingSourceIndex = currentProvenance.findIndex((p: any) => p.source === sourceName);
          
          let updatedProvenance = [...currentProvenance];
          if (existingSourceIndex >= 0) {
            // Update existing provenance entry
            updatedProvenance[existingSourceIndex] = newProvenanceEntry;
          } else {
            // Append new provenance entry
            updatedProvenance.push(newProvenanceEntry);
          }

          await this.prisma.knowledgeGraphNode.update({
            where: { id: existingNode.id },
            data: { 
              provenance: updatedProvenance,
              lastVerified: new Date()
            }
          });
        } else {
          // Create strictly if absent
          await this.prisma.knowledgeGraphNode.create({
            data: {
              label: node.label,
              nodeType: node.type,
              provenance: [newProvenanceEntry],
              firstSeen: new Date(),
              lastVerified: new Date()
            }
          });
        }
      }

      // Context node logic (Conversation or Article)
      const contextId = event.conversationId || payload.articleId;
      const contextType = event.eventType === DomainEvents.ArticleIngested ? 'Article' : 'Conversation';

      if (contextId) {
        const contextNodeLabel = `${contextType}:${contextId}`;
        const existingContextNode = await this.prisma.knowledgeGraphNode.findUnique({ where: { label: contextNodeLabel } });
        
        if (!existingContextNode) {
          await this.prisma.knowledgeGraphNode.create({
             data: { 
               label: contextNodeLabel, 
               nodeType: contextType, 
               provenance: [newProvenanceEntry] 
             }
          });
        }
        
        const contextNode = await this.prisma.knowledgeGraphNode.findUnique({ where: { label: contextNodeLabel } });
        
        if (contextNode) {
          for (const node of allNodes) {
            const targetNode = await this.prisma.knowledgeGraphNode.findUnique({ where: { label: node.label } });
            if (targetNode) {
              const edgeExists = await this.prisma.knowledgeGraphEdge.findFirst({
                where: { sourceId: contextNode.id, targetId: targetNode.id }
              });

              if (!edgeExists) {
                await this.prisma.knowledgeGraphEdge.create({
                  data: {
                    sourceId: contextNode.id,
                    targetId: targetNode.id,
                    relationship: 'CONTAINS',
                    weight: 1.0,
                  }
                });
              }
            }
          }
        }
      }

      this.logger.log(`[${this.workerName()}] Processed KG extraction for event ${event.eventId}`);
    } catch (err) {
      this.logger.error(`[${this.workerName()}] Failed to process KG update for event ${event.eventId}: ${(err as Error).message}`, (err as Error).stack);
      throw err;
    }
  }
}
