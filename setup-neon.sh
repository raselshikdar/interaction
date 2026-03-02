#!/bin/bash

echo "🚀 Setting up Neon database for the project..."

# Step 1: Generate Prisma Client
echo ""
echo "📦 Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
  echo "❌ Failed to generate Prisma Client"
  exit 1
fi
echo "✅ Prisma Client generated"

# Step 2: Push schema to database
echo ""
echo "📦 Pushing Prisma schema to Neon database..."
npx prisma db push --skip-generate
if [ $? -ne 0 ]; then
  echo "❌ Failed to push schema to database"
  exit 1
fi
echo "✅ Schema pushed to database"

# Step 3: Seed the database
echo ""
echo "📦 Seeding database with sample data..."
npx tsx prisma/seed.ts
if [ $? -ne 0 ]; then
  echo "❌ Failed to seed database"
  exit 1
fi
echo "✅ Database seeded"

echo ""
echo "✨ Database setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Run: npm run dev"
echo "   2. Open: http://localhost:3000"
echo "   3. Login with: alice@bsky.app / password123"
echo ""
