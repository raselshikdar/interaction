#!/usr/bin/env python3
import subprocess
import sys
import os

project_root = "."

def run_command(command, description):
    """Run a shell command and return True if successful."""
    try:
        print(f"\n📦 {description}...")
        result = subprocess.run(
            command,
            cwd=project_root,
            shell=True,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"❌ {description} failed")
            print("STDOUT:", result.stdout)
            print("STDERR:", result.stderr)
            return False
        
        print(f"✅ {description} completed")
        return True
    except Exception as error:
        print(f"❌ {description} error: {error}")
        return False

def main():
    print("🚀 Setting up Neon database for the project...\n")
    
    # Step 1: Generate Prisma Client
    if not run_command("npx prisma generate", "Generating Prisma Client"):
        sys.exit(1)
    
    # Step 2: Push schema to database
    if not run_command("npx prisma db push --skip-generate", "Pushing Prisma schema to Neon database"):
        sys.exit(1)
    
    # Step 3: Seed the database
    if not run_command("npx tsx prisma/seed.ts", "Seeding database with sample data"):
        sys.exit(1)
    
    print("\n✨ Database setup complete!")
    print("\n📝 Next steps:")
    print("   1. Run: npm run dev")
    print("   2. Open: http://localhost:3000")
    print("   3. Login with: alice@bsky.app / password123")
    print()

if __name__ == "__main__":
    main()
