import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StixExportService {
  private readonly logger = new Logger(StixExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateStixBundle(): Promise<any> {
    this.logger.log('Generating STIX 2.1 Bundle for approved intelligence...');
    
    // Fetch all HUMAN_APPROVED nodes
    const nodes = await this.prisma.knowledgeGraphNode.findMany({
        where: { humanVerified: true },
        include: {
            outEdges: {
                include: { target: true }
            }
        }
    });

    const stixObjects = [];
    const identityId = `identity--${uuidv4()}`;

    // CYBERMIND Identity Object
    stixObjects.push({
        type: 'identity',
        spec_version: '2.1',
        id: identityId,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        name: 'CYBERMIND AI Platform',
        identity_class: 'system'
    });

    const nodeToStixMap = new Map<string, string>();

    // Map Nodes
    for (const node of nodes) {
        const stixType = this.mapToStixType(node.nodeType);
        const stixId = `${stixType}--${uuidv4()}`;
        nodeToStixMap.set(node.id, stixId);

        stixObjects.push({
            type: stixType,
            spec_version: '2.1',
            id: stixId,
            created_by_ref: identityId,
            created: node.createdAt.toISOString(),
            modified: node.updatedAt.toISOString(),
            name: node.label,
            description: `Internal node mapped to STIX`,
            labels: [node.nodeType.toLowerCase()]
        });
    }

    // Map Edges
    for (const node of nodes) {
        for (const edge of node.outEdges) {
            const sourceRef = nodeToStixMap.get(edge.sourceId);
            const targetRef = nodeToStixMap.get(edge.targetId);

            if (sourceRef && targetRef) {
                stixObjects.push({
                    type: 'relationship',
                    spec_version: '2.1',
                    id: `relationship--${uuidv4()}`,
                    created_by_ref: identityId,
                    created: edge.createdAt.toISOString(),
                    modified: edge.createdAt.toISOString(),
                    relationship_type: edge.relationship.toLowerCase(),
                    source_ref: sourceRef,
                    target_ref: targetRef
                });
            }
        }
    }

    return {
        type: 'bundle',
        id: `bundle--${uuidv4()}`,
        objects: stixObjects
    };
  }

  private mapToStixType(internal: string): string {
      switch(internal.toUpperCase()) {
          case 'THREATACTOR': return 'threat-actor';
          case 'MALWARE': return 'malware';
          case 'CAMPAIGN': return 'campaign';
          case 'VULNERABILITY': return 'vulnerability';
          case 'IPADDRESS': return 'ipv4-addr';
          case 'DOMAIN': return 'domain-name';
          default: return 'observed-data'; // Fallback
      }
  }
}
