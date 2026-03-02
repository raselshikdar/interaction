# Database Setup Guide for Neon

## Quick Start

The application uses **Neon PostgreSQL**. Follow these steps to initialize it:

### Step 1: Verify Database Configuration

Check that `.env.local` has your Neon database URL:

```bash
cat .env.local
```

Expected format:
```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

This creates the Prisma Client based on your schema.

### Step 3: Create Database Tables

```bash
npx prisma db push --skip-generate
```

This creates all tables defined in `prisma/schema.prisma` in your Neon database.

### Step 4: Seed Sample Data (Optional)

```bash
npx prisma db seed
```

This creates test users:
- **Email:** alice@bsky.app
- **Password:** password123

## Verify Setup

Check that tables were created:

```bash
npx prisma studio
```

This opens an interactive database browser where you can see all tables and data.

## If Something Goes Wrong

### Error: "relation ... does not exist"
Tables weren't created. Run step 3 again:
```bash
npx prisma db push --skip-generate
```

### Error: "ECONNREFUSED"
Database connection failed. Check:
1. `.env.local` has correct `DATABASE_URL`
2. Neon database is running (check https://console.neon.tech)
3. Network connection is available

### Error: "unique constraint violation"
The handle or email already exists in the database. Use a different handle/email.

## Manual Database Commands

### View all tables and their schemas:
```bash
npx prisma db execute --stdin
# Then type: \dt
# Then type: \q to quit
```

### Reset database (deletes all data):
```bash
npx prisma migrate reset
```

### Create a new migration:
```bash
npx prisma migrate dev --name add_new_feature
```

## Database Structure

The Prisma schema includes:
- **User** - User accounts with profiles
- **Post** - Posts/tweets with comments, likes, reposts
- **Session** - User sessions for authentication
- **Follow** - User follow relationships
- **Like, Repost, Bookmark** - Post interactions
- **Message** - Direct messages between users
- **Notification** - User notifications
- **UserSettings** - User preferences

See `prisma/schema.prisma` for the complete schema.

## Seed Data

When you run `npx prisma db seed`, it creates:
- 2 test users (alice, bob)
- Some test posts and interactions

This is helpful for testing the application.

## Neon Dashboard

Visit https://console.neon.tech to:
- View database status
- Manage projects and databases
- View connection details
- Check usage statistics

## Next Steps

After setup is complete:
1. Run `npm run dev` to start the dev server
2. Visit http://localhost:3000
3. Try logging in with alice@bsky.app / password123
4. Or create a new account with signup
