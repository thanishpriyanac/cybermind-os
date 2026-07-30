import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { HybridRankerService } from '../src/retrieval/services/hybrid-ranker.service';
import { SearchHit } from '../src/retrieval/services/keyword-search.service';

/**
 * Retrieval E2E Test
 * Simulates ranking logic to verify freshness and conflicting source provenance.
 */
async function bootstrap() {
  console.log('Initializing Retrieval E2E Test...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const ranker = app.get(HybridRankerService);

    console.log(`[+] Testing Freshness Ranking...`);
    const oldHit: SearchHit = {
      id: 'old-1',
      type: 'Article',
      score: 1.0,
      metadata: { publishedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() } // 1 year old
    };
    const newHit: SearchHit = {
      id: 'new-1',
      type: 'Article',
      score: 1.0,
      metadata: { publishedAt: new Date().toISOString() } // today
    };

    const freshnessRanked = ranker.rank([oldHit, newHit], [], []);
    if (freshnessRanked[0].id === 'new-1') {
      console.log(`[?] Freshness logic prioritizes newer documents: PASS`);
    } else {
      console.log(`[?] Freshness logic prioritizes newer documents: FAIL`);
    }

    console.log(`[+] Testing Conflicting Source Provenance...`);
    const mockGraphHit: SearchHit = {
      id: 'node-1',
      type: 'GraphNode',
      score: 1.0,
      metadata: {
        label: 'CVE-2023-XYZ',
        nodeType: 'CVE',
        provenance: [
          { source: 'Vendor', confidence: 0.8 },
          { source: 'NVD', confidence: 1.0 }
        ]
      }
    };
    const genericHit: SearchHit = {
      id: 'node-2',
      type: 'GraphNode',
      score: 1.0,
      metadata: {
        label: 'CVE-2023-ABC',
        nodeType: 'CVE',
        provenance: [
          { source: 'RSS', confidence: 0.6 }
        ]
      }
    };

    const provenanceRanked = ranker.rank([], [], [mockGraphHit, genericHit]);
    if (provenanceRanked[0].id === 'node-1') {
      console.log(`[?] High confidence sources are boosted: PASS`);
    } else {
      console.log(`[?] High confidence sources are boosted: FAIL`);
    }

    console.log('\n=======================================');
    console.log('Retrieval Validation Complete.');
    console.log('=======================================');

  } catch (err) {
    console.error('[-] Retrieval Validation Failed:', err);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
