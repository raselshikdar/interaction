# Database Setup Guide

## What Was Fixed

The project was failing to start because it was missing the `.env.local` file which contains the required `DATABASE_URL` environment variable.

## Setup Details

### 1. Environment Configuration (✅ Completed)

A `.env.local` file has been created with the following configuration:

```env
DATABASE_URL="file:./prisma/dev.db"
```

This configures the application to use SQLite as the database, storing it locally in `prisma/dev.db`.

### 2. Database Initialization

When you first start the development server, the database will automatically initialize if it doesn't exist.

To manually initialize the database and seed it with sample data, run:

```bash
npx prisma db push --skip-generate
```

Then seed the database with sample users and posts:

```bash
bun prisma/seed.ts
# or
node --loader tsx prisma/seed.ts
```

### 3. Database Schema

The project uses Prisma ORM with SQLite. The schema includes:

- **Users**: Authentication and user profiles
- **Posts**: Social media posts with likes, reposts, and bookmarks
- **Followers**: Follow relationships between users
- **Notifications**: User notifications for interactions
- **Messages**: Direct messaging between users
- **Feeds**: Custom feeds
- **Settings**: User account and preference settings
- **Sessions**: User session tokens for authentication

### 4. Sample Data

Running the seed script will create:
- 5 sample users (alice, bob, charlie, diana, edward)
- 15 sample posts
- Follow relationships between users
- 4 sample feeds

### 5. Development

To start the development server:

```bash
npm run dev
# or
bun dev
```

The server will start on `http://localhost:3000`.

### 6. Troubleshooting

If you encounter database errors:

1. Delete the `prisma/dev.db` file
2. Run: `npx prisma db push --skip-generate`
3. Run: `bun prisma/seed.ts` (or equivalent)
4. Restart the dev server

## Default Login Credentials

After seeding, you can log in with:

- **Email**: alice@bsky.app
- **Password**: password123

(Same password applies to all seed users)
