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
