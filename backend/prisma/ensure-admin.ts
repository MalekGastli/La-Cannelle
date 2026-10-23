import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Idempotent first-admin bootstrap, run at deploy time. Does nothing unless both
// ADMIN_EMAIL and ADMIN_PASSWORD are set, and never overwrites an existing user.
const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('ensure-admin: ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
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
