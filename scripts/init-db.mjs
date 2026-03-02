#!/usr/bin/env node

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🗄️ Initializing database...\n');

const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'file:./prisma/dev.db' };

console.log('📋 Pushing database schema with Prisma...');
const prismaResult = spawnSync('npx', ['prisma', 'db', 'push', '--skip-generate'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: env,
  shell: true
});

if (prismaResult.error) {
  console.error('❌ Prisma push failed:', prismaResult.error.message);
  process.exit(1);
}

if (prismaResult.status !== 0) {
  console.error('❌ Prisma push failed with status:', prismaResult.status);
  process.exit(1);
}

console.log('\n✅ Database initialized successfully!');
