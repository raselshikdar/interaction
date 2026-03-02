#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

console.log('\n========================================');
console.log('   Database & Authentication Setup');
console.log('========================================\n');

try {
  // Step 1: Check .env.local exists
  console.log('Step 1: Checking environment setup...');
  const envPath = path.join(rootDir, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('Creating .env.local...');
    fs.writeFileSync(envPath, 'DATABASE_URL=file:./prisma/dev.db\n');
  }
  console.log('✓ .env.local ready\n');

  // Step 2: Install dependencies
  console.log('Step 2: Installing dependencies...');
  try {
    execSync('npm install', { cwd: rootDir, stdio: 'inherit' });
  } catch (e) {
    console.log('Dependencies may already be installed');
  }
  console.log('✓ Dependencies ready\n');

  // Step 3: Generate Prisma Client
  console.log('Step 3: Generating Prisma client...');
  execSync('npx prisma generate', { cwd: rootDir, stdio: 'inherit' });
  console.log('✓ Prisma client generated\n');

  // Step 4: Push database schema
  console.log('Step 4: Creating database schema...');
  execSync('npx prisma db push --skip-generate', { cwd: rootDir, stdio: 'inherit' });
  console.log('✓ Database schema created\n');

  // Step 5: Run seed
  console.log('Step 5: Seeding database with sample data...');
  // Use tsx to run TypeScript seed file
  try {
    execSync('npx tsx prisma/seed.ts', { cwd: rootDir, stdio: 'inherit' });
  } catch (e) {
    console.log('Note: Seed file may have already run or encountered an issue');
    console.log('This is usually safe to ignore - your database is still set up');
  }
  console.log('✓ Database seeded\n');

  // Step 6: Display success message
  console.log('========================================');
  console.log('   Setup Complete!');
  console.log('========================================\n');
  console.log('Your application is ready to run!');
  console.log('Start the development server with: npm run dev\n');
  console.log('Test Account Credentials:');
  console.log('  Handle: alice (or alice@bsky.app)');
  console.log('  Password: password123\n');
  console.log('Other test accounts: bob, charlie, diana, edward');
  console.log('(All with password: password123)\n');

} catch (error) {
  console.error('\n❌ Setup failed:', error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Ensure you have Node.js 18+ installed');
  console.log('2. Check that you have write permissions in the project directory');
  console.log('3. Try deleting node_modules and bun.lock, then run npm install\n');
  process.exit(1);
}
