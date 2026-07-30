import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER' },
  });

  // Admin User
  const adminPasswordHash = await argon2.hash('admin123');
  await prisma.user.upsert({
    where: { email: 'admin@cybermind.local' },
    update: {},
    create: {
      email: 'admin@cybermind.local',
      passwordHash: adminPasswordHash,
      roles: {
        connect: [{ id: adminRole.id }],
      },
    },
  });

  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
