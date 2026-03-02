# Neon Database Setup Guide

## Overview

This project is now configured to use **Neon**, a serverless PostgreSQL database. The connection is automatically configured and ready to use.

## Database Information

- **Project Name**: neon-blue-umbrella
- **Project ID**: steep-brook-81100678
- **Database**: neondb
- **Region**: AWS US East 1
- **PostgreSQL Version**: 17

## Setup Instructions

### Step 1: Initialize Database (One-time setup)

Run the database setup script to create all tables and seed sample data:

```bash
npm run db:setup
```

This command will:
1. Generate Prisma Client
2. Push the Prisma schema to the Neon database
3. Seed the database with sample users and posts

### Step 2: Verify Connection

Check that the connection string is properly set in `.env.local`:

```bash
cat .env.local
```

You should see a PostgreSQL connection string for your Neon database.

### Step 3: Start Development

```bash
npm run dev
```

The application will start at http://localhost:3000

## Test Credentials

After running `npm run db:setup`, you can log in with:

- **Email**: alice@bsky.app
- **Password**: password123

Or create a new account by signing up on the app.

## Database Commands

### View Database Schema

```bash
npm run db:generate
```

Generates the Prisma Client based on the schema.

### Migrate Database

```bash
npm run db:migrate
```

Create a new migration file for schema changes.

### Reset Database

```bash
npm run db:reset
```

**⚠️ Warning**: This will delete all data and recreate the schema.

### Seed Database

```bash
npm run db:seed
```

Run the seed script to populate the database with sample data.

## Database Schema

The application includes the following main tables:

- **Users**: User accounts and profiles
- **Posts**: Social media posts/tweets
- **Comments**: Comments on posts
- **Likes**: Post likes
- **Reposts**: Retweets/reposts
- **Bookmarks**: Saved posts
- **Follows**: User follow relationships
- **Messages**: Direct messages
- **Notifications**: User notifications
- **Sessions**: User sessions/authentication
- **UserSettings**: User preferences

## Environment Variables

The connection string is stored in `.env.local` as `DATABASE_URL`. This file is already configured and should not be committed to version control.

For security:
- Never share your `.env.local` file
- Rotate database passwords regularly through the Neon console
- Use connection pooling for production applications

## Troubleshooting

### Connection Issues

If you get connection errors:

1. Verify the DATABASE_URL in `.env.local`
2. Check that your network allows connections to Neon
3. Ensure the Neon database is active (it may suspend if idle)

### Migration Failures

If `npm run db:setup` fails:

1. Check the error message for details
2. Verify that all required columns are present in the schema
3. Ensure there are no conflicts with existing data

### Slow Queries

To identify slow queries:

```bash
npm run db:analyze
```

This will show query performance statistics.

## Production Deployment

For production deployment:

1. Set the DATABASE_URL environment variable in your hosting platform
2. Run migrations automatically as part of your deployment pipeline
3. Consider enabling connection pooling for high-traffic scenarios
4. Monitor database performance through the Neon console

## Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Prisma with Neon Guide](https://neon.tech/docs/guides/prisma)
- [Connection Pooling Guide](https://neon.tech/docs/connect/connection-pooling)

## Support

If you encounter issues:

1. Check the Neon console for database status
2. Review the error messages in your application logs
3. Consult the Neon documentation
4. Visit the Neon community forums for additional help
