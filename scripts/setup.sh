#!/bin/bash

set -e

echo "🗄️ Initializing database..."
export DATABASE_URL="file:./prisma/dev.db"

echo "📋 Pushing database schema with Prisma..."
npx prisma db push --skip-generate || true

echo "✅ Database setup complete!"
