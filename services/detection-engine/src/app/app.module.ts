import { Module, OnModuleInit } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { Client } from '@opensearch-project/opensearch';
import { EventPlatformModule } from '../../../../packages/sdk/event-client/src/nestjs-integration';
import { RuleScheduler } from '../scheduler/rule-scheduler';
import { SigmaCompiler } from '../compiler/sigma.compiler';
import { QueryExecutor } from '../executor/query-executor';
import { AlertGenerator } from '../alerts/alert-generator';
import { AlertPublisher } from '../alerts/alert-publisher';
import { InMemoryRuleRepository, RuleRepository } from '../repository/rule.repository';
import { DetectionRule } from '../../../../packages/schemas/src/siem/detection-rule';
import { CybermindKafkaPublisher } from '../../../../packages/sdk/event-client/src/kafka-publisher';

// Seed with foundational platform detection rules
const PLATFORM_RULES: DetectionRule[] = [
  {
    id: 'rule-brute-force-001',
    version: '1.0.0',
    name: 'Repeated Authentication Failures',
    description: 'Detects repeated failed logon attempts within a rolling window.',
    author: 'CYBERMIND Platform',
    tenantId: 'GLOBAL',
    category: 'AUTHENTICATION',
    tags: ['brute-force', 'credential-access'],
    mitreTactics: ['Credential Access'],
    mitreTechniques: ['T1110'],
    severity: 'HIGH',
    confidence: 75,
    references: ['https://attack.mitre.org/techniques/T1110/'],
    requiredFields: ['category', 'normalized_data.action'],
    minimumSchemaVersion: '1.0.0',
    schedule: { type: 'INTERVAL', value: '5m' },
    query: {
      language: 'sigma',
      expression: JSON.stringify({
        detection: {
          condition: 'keywords | all',
          keywords: ['LOGIN_FAILURE'],
          fields: { category: 'AUTHENTICATION' },
        },
        filters: { severities: ['MEDIUM', 'HIGH', 'CRITICAL'] },
        timeWindowMinutes: 5,
      }),
    },
    alertTitle: 'Repeated Authentication Failures Detected',
    alertDescription: 'Multiple failed logon attempts detected from the same source.',
    enabled: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    testFixtures: {
      positiveEvents: [
        { canonicalEvent: { normalizedData: { action: 'LOGIN_FAILURE' }, category: 'AUTHENTICATION' } as any },
      ],
      negativeEvents: [
        { canonicalEvent: { normalizedData: { action: 'LOGIN_SUCCESS' }, category: 'AUTHENTICATION' } as any },
      ],
    },
  },
  {
    id: 'rule-powershell-001',
    version: '1.0.0',
    name: 'Suspicious PowerShell Execution',
    description: 'Detects PowerShell script block executions on Windows endpoints.',
    author: 'CYBERMIND Platform',
    tenantId: 'GLOBAL',
    category: 'PROCESS',
    tags: ['execution', 'powershell'],
    mitreTactics: ['Execution'],
    mitreTechniques: ['T1059.001'],
    severity: 'MEDIUM',
    confidence: 70,
    references: ['https://attack.mitre.org/techniques/T1059/001/'],
    requiredFields: ['category', 'normalized_data.action'],
    minimumSchemaVersion: '1.0.0',
    schedule: { type: 'INTERVAL', value: '5m' },
    query: {
      language: 'sigma',
      expression: JSON.stringify({
        detection: {
          condition: 'keywords | all',
          keywords: ['POWERSHELL_EXECUTION'],
          fields: { category: 'SCRIPT' },
        },
        timeWindowMinutes: 5,
      }),
    },
    alertTitle: 'Suspicious PowerShell Execution',
    alertDescription: 'PowerShell script block execution recorded on a monitored endpoint.',
    enabled: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventPlatformModule.forRoot({
      clientId: 'detection-engine',
      brokers: [(process.env.KAFKA_BROKER ?? 'localhost:9092')],
      sourceName: '/cybermind/detection',
    }),
  ],
  providers: [
    // OpenSearch
    {
      provide: Client,
      useFactory: () =>
        new Client({
          node: process.env.OPENSEARCH_NODE ?? 'http://localhost:9200',
          auth: {
            username: process.env.OPENSEARCH_USER ?? 'admin',
            password: process.env.OPENSEARCH_PASSWORD ?? 'admin',
          },
          ssl: { rejectUnauthorized: false },
        }),
    },
    // Rule Repository (seeded)
    { provide: RuleRepository, useClass: InMemoryRuleRepository },
    // Engine Components
    SigmaCompiler,
    QueryExecutor,
    AlertGenerator,
    AlertPublisher,
    RuleScheduler,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly ruleRepository: RuleRepository) {}

  async onModuleInit() {
    // Seed platform rules
    for (const rule of PLATFORM_RULES) {
      await this.ruleRepository.save(rule);
    }
  }
}
