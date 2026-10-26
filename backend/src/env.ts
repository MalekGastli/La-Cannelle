import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

const candidateEnvPaths = [
  path.resolve(__dirname, '..', '.env'),
  path.resolve(__dirname, '../..', '.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
];

const existingEnvPath = candidateEnvPaths.find((envPath) => fs.existsSync(envPath));

if (existingEnvPath) {
  dotenv.config({ path: existingEnvPath });
} else {
  dotenv.config();
}

// Vercel-managed Neon database (connected through the Vercel Storage integration): when present it wins over
// DATABASE_URL, so the site runs on the permanent database instead of an old/temporary one.
const managedDatabaseUrl = process.env.LACANNELLEDB_DATABASE_URL;
if (managedDatabaseUrl) {
  let url = managedDatabaseUrl;
  // Neon's pooled endpoint is PgBouncer in transaction mode: Prisma needs pgbouncer=true there
  if (/-pooler\./.test(url) && !/[?&]pgbouncer=/.test(url)) {
    url += `${url.includes('?') ? '&' : '?'}pgbouncer=true&connect_timeout=15`;
  }
  process.env.DATABASE_URL = url;
}
