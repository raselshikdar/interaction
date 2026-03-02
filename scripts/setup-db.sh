#!/bin/bash

# Exit on error
set -e

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Setting up Prisma..."
npx prisma generate

echo "📋 Pushing database schema..."
npx prisma db push --skip-generate

echo "🌱 Seeding database..."
bun prisma/seed.ts

echo "✅ Database setup complete!"
