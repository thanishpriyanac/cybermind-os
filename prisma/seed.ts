import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CYBERMIND AI database...');

  // 1. Seed Default Admin User with Bcrypt Password
  const adminEmail = 'admin@rexonsofttech.com';
  const defaultPassword = 'SuperSecurePassword123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      mfaEnabled: false,
    },
  });
  console.log(`Admin user initialized: ${admin.email}`);

  // 2. Seed Default AI Models in Registry
  const models = [
    {
      provider: 'openai',
      modelKey: 'gpt-4o',
      displayName: 'OpenAI GPT-4o',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      costPerInput1k: 0.005,
      costPerOutput1k: 0.015,
      supportsStreaming: true,
      supportsVision: true,
      supportsTools: true,
      supportsEmbedding: true,
      isLocal: false,
      healthStatus: 'ONLINE',
    },
    {
      provider: 'anthropic',
      modelKey: 'claude-3-5-sonnet',
      displayName: 'Anthropic Claude 3.5 Sonnet',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      costPerInput1k: 0.003,
      costPerOutput1k: 0.015,
      supportsStreaming: true,
      supportsVision: true,
      supportsTools: true,
      supportsEmbedding: false,
      isLocal: false,
      healthStatus: 'ONLINE',
    },
    {
      provider: 'google',
      modelKey: 'gemini-1.5-pro',
      displayName: 'Google Gemini 1.5 Pro',
      contextWindow: 1000000,
      maxOutputTokens: 8192,
      costPerInput1k: 0.0035,
      costPerOutput1k: 0.0105,
      supportsStreaming: true,
      supportsVision: true,
      supportsTools: true,
      supportsEmbedding: true,
      isLocal: false,
      healthStatus: 'ONLINE',
    },
    {
      provider: 'ollama',
      modelKey: 'llama3.1',
      displayName: 'Local Llama 3.1 (Ollama)',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      costPerInput1k: 0.0,
      costPerOutput1k: 0.0,
      supportsStreaming: true,
      supportsVision: false,
      supportsTools: false,
      supportsEmbedding: true,
      isLocal: true,
      healthStatus: 'ONLINE',
    },
  ];

  for (const m of models) {
    await prisma.providerConfiguration.upsert({
      where: { modelKey: m.modelKey },
      update: m,
      create: m,
    });
  }

  console.log(`Seeded ${models.length} AI Provider Models.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
