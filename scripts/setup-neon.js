#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');

function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n📦 ${description}...`);
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ ${description} failed with code ${code}`);
        reject(new Error(`${description} failed`));
      } else {
        console.log(`✅ ${description} completed`);
        resolve();
      }
    });

    child.on('error', (err) => {
      console.error(`❌ ${description} error:`, err.message);
      reject(err);
    });
  });
}

async function main() {
  console.log('🚀 Setting up Neon database for the project...\n');

  try {
    // Step 1: Generate Prisma Client
    await runCommand('npx', ['prisma', 'generate'], 'Generating Prisma Client');

    // Step 2: Push schema to database
    await runCommand('npx', ['prisma', 'db', 'push', '--skip-generate'], 'Pushing Prisma schema to Neon database');

    // Step 3: Seed the database
    await runCommand('npx', ['tsx', 'prisma/seed.ts'], 'Seeding database with sample data');

    console.log('\n✨ Database setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Open: http://localhost:3000');
    console.log('   3. Login with: alice@bsky.app / password123');
    console.log('\n');
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
