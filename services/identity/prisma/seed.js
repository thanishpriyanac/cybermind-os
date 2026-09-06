const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CYBERMIND Identity Database...');

  // 1. Create Default Platform Tenants
  const tenantMaster = await prisma.tenant.upsert({
    where: { slug: 'cybermind-master-tenant' },
    update: { status: 'ACTIVE' },
    create: {
      name: 'CYBERMIND Master Tenant',
      slug: 'cybermind-master-tenant',
      status: 'ACTIVE',
      settings: { isDefault: true },
    },
  });

  const tenantPlatform = await prisma.tenant.upsert({
    where: { slug: 'cybermind-platform' },
    update: { status: 'ACTIVE' },
    create: {
      name: 'CYBERMIND Platform',
      slug: 'cybermind-platform',
      status: 'ACTIVE',
      settings: { isDefault: false },
    },
  });

  const tenants = [tenantMaster, tenantPlatform];

  // Argon2id hashes for standard passwords
  // admin123 hash: $argon2id$v=19$m=65536,p=4,t=3$vrHmYn3c1A8VgbzSSbA7LQ$32qEUdbbGCRvEryfwl28eO0pBZhNSvWTKgzL5tz4d6w
  // ChangeMe123! hash: $argon2id$v=19$m=65536,p=4,t=3$NRmzuh2ci1X6dHpDH0iB/w$3gKBhOjmesmRdHL2TEUGU2+xRiR/vpOOiPzORXhgxhk
  const admin123Hash = '$argon2id$v=19$m=65536,p=4,t=3$vrHmYn3c1A8VgbzSSbA7LQ$32qEUdbbGCRvEryfwl28eO0pBZhNSvWTKgzL5tz4d6w';

  for (const t of tenants) {
    // 2. Create Roles per Tenant
    const adminRole = await prisma.role.upsert({
      where: {
        tenantId_name: {
          tenantId: t.id,
          name: 'Platform Administrator',
        },
      },
      update: {},
      create: {
        tenantId: t.id,
        name: 'Platform Administrator',
        description: 'Superuser access to all CYBERMIND domains',
      },
    });

    await prisma.role.upsert({
      where: {
        tenantId_name: {
          tenantId: t.id,
          name: 'Security Analyst',
        },
      },
      update: {},
      create: {
        tenantId: t.id,
        name: 'Security Analyst',
        description: 'Access to SOC, SIEM, and CTI',
      },
    });

    // 3. Create Basic Permissions
    const permissionsData = [
      { resource: 'case', action: 'read', effect: 'allow' },
      { resource: 'case', action: 'write', effect: 'allow' },
      { resource: 'alert', action: 'read', effect: 'allow' },
      { resource: 'policy', action: 'read', effect: 'allow' },
    ];

    for (const perm of permissionsData) {
      const p = await prisma.permission.upsert({
        where: {
          resource_action_effect: {
            resource: perm.resource,
            action: perm.action,
            effect: perm.effect,
          },
        },
        update: {},
        create: perm,
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: p.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: p.id,
        },
      });
    }

    // 4. Create Admin Users (admin@cybermind.local and admin@cybermind.io)
    const emails = ['admin@cybermind.local', 'admin@cybermind.io'];
    for (const email of emails) {
      const adminUser = await prisma.user.upsert({
        where: {
          tenantId_email: {
            tenantId: t.id,
            email,
          },
        },
        update: {
          passwordHash: admin123Hash,
          status: 'ACTIVE',
        },
        create: {
          tenantId: t.id,
          email,
          status: 'ACTIVE',
          passwordHash: admin123Hash,
        },
      });

      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: adminUser.id,
            roleId: adminRole.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      });
    }
  }

  // 5. Default Identity Provider
  const existingIdp = await prisma.identityProvider.findFirst({ where: { type: 'LOCAL' } });
  if (!existingIdp) {
    await prisma.identityProvider.create({
      data: {
        name: 'Internal Directory',
        type: 'LOCAL',
        status: 'ACTIVE',
      },
    });
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
