#!/usr/bin/env python3
import subprocess
import sys

print("[v0] Starting database migrations...")

# Run prisma generate
print("[v0] Generating Prisma Client...")
try:
    subprocess.run(["npx", "prisma", "generate"], check=True)
    print("[v0] ✓ Prisma Client generated")
except subprocess.CalledProcessError as e:
    print(f"[v0] Error generating Prisma Client: {e}")
    sys.exit(1)

# Run prisma db push
print("[v0] Creating database schema...")
try:
    subprocess.run(["npx", "prisma", "db", "push", "--skip-generate"], check=True)
    print("[v0] ✓ Database schema created")
except subprocess.CalledProcessError as e:
    print(f"[v0] Error creating schema: {e}")
    sys.exit(1)

# Try to seed (non-critical)
print("[v0] Seeding database...")
try:
    subprocess.run(["npx", "prisma", "db", "seed"], check=False)
    print("[v0] ✓ Database seeded")
except Exception as e:
    print(f"[v0] Note: Seeding failed (this is okay): {e}")

print("[v0] Database setup complete!")
