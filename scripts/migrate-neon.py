#!/usr/bin/env python3
"""
Database migration script for Neon PostgreSQL
Runs Prisma migrations and seeds the database
"""

import subprocess
import sys
import os

def run_command(cmd, description):
    """Execute a command and handle errors"""
    print(f"\n{'='*60}")
    print(f"[v0] {description}")
    print(f"{'='*60}")
    print(f"Running: {' '.join(cmd)}")
    
    result = subprocess.run(cmd, cwd=".")
    
    if result.returncode != 0:
        print(f"[v0] Error: {description} failed with code {result.returncode}")
        return False
    
    print(f"[v0] ✓ {description} completed successfully")
    return True

def main():
    print("[v0] Starting Neon database setup...")
    
    # Step 1: Generate Prisma Client
    if not run_command(
        ["npx", "prisma", "generate"],
        "Generating Prisma Client"
    ):
        sys.exit(1)
    
    # Step 2: Run Prisma migrations
    if not run_command(
        ["npx", "prisma", "db", "push", "--skip-generate"],
        "Creating database schema"
    ):
        sys.exit(1)
    
    # Step 3: Seed the database
    if not run_command(
        ["npx", "prisma", "db", "seed"],
        "Seeding database with sample data"
    ):
        print("[v0] Warning: Seed script may have failed, but schema should be created")
    
    print(f"\n{'='*60}")
    print("[v0] Database setup complete!")
    print("[v0] Your Neon PostgreSQL database is ready to use")
    print("[v0] You can now run: npm run dev")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
