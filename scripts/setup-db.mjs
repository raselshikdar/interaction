import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function runCommand(command, description) {
  try {
    console.log(`\n📦 ${description}...`);
    execSync(command, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
    });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed`);
    throw error;
  }
}

async function main() {
  console.log('🚀 Setting up Neon database for the project...\n');

  try {
    // Step 1: Generate Prisma Client
    runCommand('npx prisma generate', 'Generating Prisma Client');

    // Step 2: Push schema to database
    runCommand('npx prisma db push --skip-generate', 'Pushing Prisma schema to Neon database');

    // Step 3: Seed the database
    runCommand('npx tsx prisma/seed.ts', 'Seeding database with sample data');

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
