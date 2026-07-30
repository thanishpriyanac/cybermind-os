import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const messages = await prisma.message.findMany();
  console.log('Messages in DB:', JSON.stringify(messages, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
