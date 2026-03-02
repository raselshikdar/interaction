#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');

async function setup() {
  console.log('\n🚀 Setting up Bluesky Clone...\n');

  try {
    // Check if .env.local exists
    const envPath = path.join(rootDir, '.env.local');
    if (!fs.existsSync(envPath)) {
      console.log('📝 Creating .env.local file...');
      fs.writeFileSync(envPath, 'DATABASE_URL="file:./prisma/dev.db"\n');
      console.log('✅ Created .env.local\n');
    } else {
      console.log('✅ .env.local already exists\n');
    }

    // Push Prisma schema
    console.log('📊 Creating database schema...');
    try {
      execSync('npx prisma db push --skip-generate --accept-data-loss', {
        cwd: rootDir,
        stdio: 'inherit',
        env: { 
          ...process.env,
          DATABASE_URL: 'file:./prisma/dev.db'
        }
      });
      console.log('✅ Database schema created\n');
    } catch (error) {
      console.error('❌ Failed to create database schema');
      throw error;
    }

    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    try {
      execSync('npx prisma generate', {
        cwd: rootDir,
        stdio: 'inherit',
        env: { 
          ...process.env,
          DATABASE_URL: 'file:./prisma/dev.db'
        }
      });
      console.log('✅ Prisma client generated\n');
    } catch (error) {
      console.error('❌ Failed to generate Prisma client');
      throw error;
    }

    // Seed database
    console.log('🌱 Seeding database with sample data...');
    try {
      execSync('npx tsx prisma/seed.ts', {
        cwd: rootDir,
        stdio: 'inherit',
        env: { 
          ...process.env,
          DATABASE_URL: 'file:./prisma/dev.db'
        }
      });
      console.log('✅ Database seeded\n');
    } catch (error) {
      console.warn('⚠️  Database seeding had issues, but this might be OK if the schema was created');
    }

    console.log('✅ Setup complete!\n');
    console.log('You can now run: npm run dev\n');
    console.log('Test login credentials:');
    console.log('  Email: alice@bsky.app');
    console.log('  Password: password123\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup();
