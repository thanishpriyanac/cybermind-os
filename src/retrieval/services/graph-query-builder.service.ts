import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GraphIntent } from './intent-parser.service';

@Injectable()
export class GraphQueryBuilderService {
  private readonly logger = new Logger(GraphQueryBuilderService.name);

  constructor(private readonly prisma: PrismaService) {}

  async executeQuery(intent: GraphIntent): Promise<any[]> {
    this.logger.log(`Executing safe Prisma query for intent targeting: ${intent.name || 'All'}`);
    
    // Safety boundaries: Ensure we never run arbitrary raw SQL.
    // Map the intent to safe, parameterized Prisma ORM calls.
    
    if (intent.entityType && intent.name && intent.relationship && intent.targetType) {
        // Example Prisma traversal (Mocked graph nodes for architectural demo)
        const results = await this.prisma.knowledgeGraphNode.findMany({
            where: {
                nodeType: intent.entityType,
                label: { contains: intent.name, mode: 'insensitive' },
                outEdges: {
                    some: {
                        relationship: intent.relationship,
                        target: {
                            nodeType: intent.targetType
                        }
                    }
                }
            },
            include: {
                outEdges: {
                    include: { target: true }
                }
            },
            take: intent.limit || 50,
        });
        
        return results;
    }
    
    // Fallback simple search
    return this.prisma.knowledgeGraphNode.findMany({
        take: intent.limit || 10
    });
  }
}
