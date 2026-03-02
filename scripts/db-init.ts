import { execSync } from 'child_process';
import path from 'path';

const rootDir = path.join(__dirname, '..');

async function initializeDatabase() {
  try {
    console.log('[v0] Starting database initialization...');

    // Push the Prisma schema to create tables
    console.log('[v0] Pushing Prisma schema to database...');
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      cwd: rootDir,
      stdio: 'inherit',
      env: { 
        ...process.env,
        DATABASE_URL: 'file:./prisma/dev.db'
      }
    });

    console.log('[v0] Database schema created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[v0] Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
