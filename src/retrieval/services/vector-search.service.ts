import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingService } from '../../ingestion/services/embedding/embedding.service';
import { SearchHit } from './keyword-search.service';

@Injectable()
export class VectorSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: EmbeddingService
  ) {}

  async search(query: string): Promise<SearchHit[]> {
    const vector = await this.embedding.generateEmbedding(query);
    
    // In a real environment with pgvector:
    // SELECT id, 1 - (embedding <=> $1) as similarity FROM CyberArticle ORDER BY similarity DESC LIMIT 10;
    
    // For this mock implementation:
    const articles = await this.prisma.cyberArticle.findMany({ take: 10 });
    
    return articles.map(a => ({
      id: a.id,
      type: 'Article',
      score: 0.85, // Mock cosine similarity
      metadata: a
    }));
  }
}
