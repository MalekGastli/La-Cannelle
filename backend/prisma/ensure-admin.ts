import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SYSTEM_ROLES } from '../src/utils/permissions';

// Idempotent first-admin bootstrap, run at deploy time. Does nothing unless both
// ADMIN_EMAIL and ADMIN_PASSWORD are set, and never overwrites an existing user.
const prisma = new PrismaClient();

async function ensureSystemRoles() {
  // Created once; later edits in the admin area are never overwritten
  for (const def of SYSTEM_ROLES) {
    const existing = await prisma.role.findUnique({ where: { name: def.name } });
    if (existing) continue;
    await prisma.role.create({
      data: {
        name: def.name,
        description: def.description,
        isSystem: true,
        permissions: { create: def.permissions.map((p) => ({ resource: p.split('.')[0], action: p.split('.')[1] })) },
      },
    });
    console.log(`ensure-admin: created role ${def.name}`);
  }
}

async function main() {
  await ensureSystemRoles();

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('ensure-admin: ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  // One-time reset: set ADMIN_FORCE_PASSWORD for a single deploy, then clear it again
  const forced = process.env.ADMIN_FORCE_PASSWORD;
  if (existing && forced) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: await bcrypt.hash(forced, 10), role: UserRole.ADMIN, isActive: true },
    });
    console.log('ensure-admin: owner password was reset from ADMIN_FORCE_PASSWORD');
    return;
  }

  if (existing) {
    console.log('ensure-admin: admin already exists, leaving it unchanged');
    return;
  }

  await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password, 10),
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  });
  console.log('ensure-admin: created admin user');
}

main()
  .catch((error) => {
    console.error('ensure-admin failed', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
