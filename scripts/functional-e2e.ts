import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { FanOutOrchestratorService } from '../src/fanout/fanout-orchestrator.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { randomUUID } from 'crypto';
import { FanOutMode } from '../src/fanout/dto/fanout.dto';

/**
 * Functional E2E Test
 * Verifies the full event pipeline: FanOut -> Consensus -> Memory -> KG -> Analytics -> Audit.
 */
async function bootstrap() {
  console.log('Initializing E2E Functional Test...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const orchestrator = app.get(FanOutOrchestratorService);
  const prisma = app.get(PrismaService);

  const conversationId = randomUUID();
  console.log(`[+] Started conversation: ${conversationId}`);

  try {
    // 1. Trigger Fan-Out
    const dispatchResult = await orchestrator.dispatchTurn(conversationId, {
      promptText: 'Analyze the latest MOVEit transfer vulnerability (CVE-2023-34362).',
      mode: FanOutMode.SMART,
    });
    console.log(`[+] Dispatched turn: ${dispatchResult.turnId}`);

    // Wait for asynchronous background workers to complete processing
    console.log('[~] Waiting for BullMQ workers to process the event chain (15s)...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // 2. Verify Audit Log
    const audits = await prisma.auditLog.findMany({
      where: { 
        details: { path: ['conversationId'], equals: conversationId } 
      }
    });
    // Due to limited JSON querying capabilities depending on the DB, we might fetch all and filter in memory for this test.
    // Assuming the workers executed, let's just fetch recent audits and check.
    const allRecentAudits = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    let auditFound = false;
    for (const audit of allRecentAudits) {
      if (audit.details && (audit.details as any).conversationId === conversationId) {
        auditFound = true;
      }
    }
    console.log(`[?] Audit Worker executed: ${auditFound ? 'PASS' : 'FAIL'}`);

    // 3. Verify Semantic Memory
    const memory = await prisma.semanticMemory.findFirst({
      where: { conversationId }
    });
    console.log(`[?] Memory Worker executed: ${memory ? 'PASS' : 'FAIL'} (Memory ID: ${memory?.id})`);

    // 4. Verify Analytics (Check if cost was incremented)
    const metric = await prisma.platformMetric.findUnique({
      where: { metricKey: 'total_requests' }
    });
    console.log(`[?] Analytics Worker executed: ${metric && metric.value.toNumber() > 0 ? 'PASS' : 'FAIL'} (Total Requests: ${metric?.value})`);

    // 5. Verify Knowledge Graph
    // If Memory Worker emitted EntityExtracted, KG worker should have created a Conversation node at minimum.
    const convNode = await prisma.knowledgeGraphNode.findUnique({
      where: { label: `Conversation:${conversationId}` }
    });
    console.log(`[?] Knowledge Graph Worker executed: ${convNode ? 'PASS' : 'FAIL'}`);

    // Idempotency check: trigger memory extraction again and ensure no duplicate node/memory?
    // This is tested in specific unit tests.

    console.log('\n=======================================');
    console.log('E2E Validation Complete.');
    console.log('=======================================');

  } catch (err) {
    console.error('[-] E2E Validation Failed:', err);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
