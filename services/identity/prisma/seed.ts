import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CYBERMIND Identity Database...');

  // 1. Create Default Platform Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'cybermind-platform' },
    update: {},
    create: {
      name: 'CYBERMIND Platform',
      slug: 'cybermind-platform',
      status: 'ACTIVE',
      settings: { isDefault: true },
    },
  });

  // 2. Create Default Roles
  const adminRole = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'Platform Administrator',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Platform Administrator',
      description: 'Superuser access to all CYBERMIND domains',
    },
  });

  const analystRole = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'Security Analyst',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
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

    // Assign to Admin Role
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

  // 4. Create Default Admin User
  const adminUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@cybermind.io',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@cybermind.io',
      status: 'ACTIVE',
      // Note: In reality, use Argon2id hash. This is just seed data.
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$DUMMYHASH$DUMMYHASH',
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

  // 5. Default Identity Provider
  await prisma.identityProvider.create({
    data: {
      name: 'Internal Directory',
      type: 'LOCAL',
      status: 'ACTIVE',
    }
  });

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
