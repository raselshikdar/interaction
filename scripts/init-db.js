#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🗄️ Initializing database...\n');

try {
  console.log('📋 Pushing database schema with Prisma...');
  execSync('npx prisma db push --skip-generate', {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'file:./prisma/dev.db' }
  });

  console.log('\n🌱 Seeding database...');
  execSync('node --loader tsx prisma/seed.ts', {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'file:./prisma/dev.db' }
  });

  console.log('\n✅ Database initialization complete!');
} catch (error) {
  console.error('❌ Database initialization failed:', error.message);
  process.exit(1);
}
