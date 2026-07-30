import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DomainEventBusService } from '../../events/domain-event-bus.service';
import { DomainEvents } from '../../events/domain-events.registry';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface ExportValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class DatasetExportService {
  private readonly logger = new Logger(DatasetExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async generateDataset(exportPath: string = './exports'): Promise<string> {
    this.logger.log('Generating Dataset Export...');

    // 1. Fetch Verified Knowledge
    const verifiedNodes = await this.prisma.knowledgeGraphNode.findMany({
      where: { 
        humanVerified: true,
        isAlias: false
      },
      include: {
        outEdges: {
          include: { target: true }
        }
      }
    });

    // 2. Validate Data Quality before Export
    const { valid, errors } = this.validateExportData(verifiedNodes);
    if (!valid) {
      this.logger.error(`Dataset validation failed: ${errors.join(', ')}`);
      throw new Error("Dataset validation failed. Please review data quality.");
    }

    // 3. Transform to OpenAI Chat JSONL Format
    // Format: {"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}], "metadata": {...}}
    
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath, { recursive: true });
    }

    const filename = `cti_export_${Date.now()}.jsonl`;
    const fullPath = path.join(exportPath, filename);
    const writeStream = fs.createWriteStream(fullPath);

    let exportedCount = 0;

    for (const node of verifiedNodes) {
      if (node.outEdges.length > 0) {
        // Create an instruction-tuning example based on node relationships
        const relationshipsStr = node.outEdges.map(e => `${e.relationship.replace(/_/g, ' ')} ${e.target.label}`).join(', ');
        
        const jsonlLine = {
          messages: [
            { role: "system", content: "You are a highly accurate Cyber Threat Intelligence assistant." },
            { role: "user", content: `What intelligence is known about ${node.label}?` },
            { role: "assistant", content: `Based on verified intelligence, ${node.label} ${relationshipsStr}.` }
          ],
          metadata: { // Provenance maintained for auditing
            nodeId: node.id,
            verifiedAt: node.lastVerified,
            confidence: node.humanConfidence ?? node.aiConfidence,
            provenance: node.provenance
          }
        };

        writeStream.write(JSON.stringify(jsonlLine) + '\n');
        exportedCount++;
      }
    }

    writeStream.end();

    await this.eventBus.publish({
        eventId: randomUUID(),
        eventType: DomainEvents.DatasetGenerated,
        occurredAt: new Date().toISOString(),
        version: 1,
        correlationId: randomUUID(),
        traceId: randomUUID(),
        source: 'DatasetExportService',
        payload: { filename, exportedCount }
    });

    this.logger.log(`Dataset generated successfully: ${filename} with ${exportedCount} examples.`);
    return fullPath;
  }

  private validateExportData(nodes: any[]): ExportValidationResult {
    const errors: string[] = [];
    
    for (const node of nodes) {
      if (node.humanConfidence === null && node.aiConfidence < 0.6) {
        errors.push(`Node ${node.id} has low confidence and no human verification score.`);
      }
      if (!Array.isArray(node.provenance) || node.provenance.length === 0) {
        errors.push(`Node ${node.id} lacks provenance data.`);
      }
      // Check for cyclic self-referencing (simple check)
      const hasSelfCycle = node.outEdges.some((e: any) => e.targetId === node.id);
      if (hasSelfCycle) {
        errors.push(`Node ${node.id} has a self-referencing cycle.`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
