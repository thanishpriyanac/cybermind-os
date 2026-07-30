import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SearchHit {
  id: string;
  type: 'Article' | 'GraphNode';
  score: number; // Normalized 0-1
  metadata: any;
  matchedBy?: { type: string; score: number }[];
}

@Injectable()
export class KeywordSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string): Promise<SearchHit[]> {
    // In a real environment, we'd use raw SQL with to_tsvector and ts_rank.
    // E.g., SELECT id, ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', $1)) as score
    
    // For this mock implementation without raw Postgres syntax:
    const articles = await this.prisma.cyberArticle.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } }
        ]
      },
      take: 10
    });

    return articles.map(a => ({
      id: a.id,
      type: 'Article',
      score: 0.8, // Mock score for contains match
      metadata: a
    }));
  }
}
