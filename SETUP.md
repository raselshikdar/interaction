# Setup Guide

This is a Next.js application with a Bluesky-like social media interface, using Prisma ORM with SQLite database.

## Quick Start

### 1. Install Dependencies
```bash
npm install
# or
bun install
# or
yarn install
```

### 2. Initialize the Database
The first time you run the application, you need to set up the database:

```bash
npm run db:setup
```

This command will:
- Create the SQLite database schema from the Prisma schema
- Seed the database with sample users and posts

### 3. Run the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Database

The application uses SQLite with Prisma ORM. The database file is stored at `prisma/dev.db`.

### Available Database Commands

- `npm run db:push` - Push schema changes to the database
- `npm run db:generate` - Generate Prisma client types
- `npm run db:migrate` - Create a new migration
- `npm run db:reset` - Reset the entire database
- `npm run db:seed` - Seed the database with sample data

## Test Credentials

After running `npm run db:setup`, you can log in with:

- **Email**: alice@bsky.app
- **Password**: password123

Or any of these test accounts:
- bob@bsky.app
- charlie@bsky.app
- diana@bsky.app
- edward@bsky.app

## Troubleshooting

### "SQLITE_CANTOPEN: unable to open database file"
This error means the database hasn't been initialized. Run:
```bash
npm run db:setup
```

### Database already has data but you want to reset
```bash
npm run db:reset
```

### TypeScript or build errors
The application has `typescript: { ignoreBuildErrors: true }` configured for development flexibility. This is intentional.

## Project Structure

- `/src/app` - Next.js app directory and API routes
- `/src/components` - React components (UI and custom components)
- `/src/lib` - Utility functions (database client, authentication, etc.)
- `/src/providers` - React context providers
- `/src/store` - Zustand store for state management
- `/prisma` - Database schema and seed script
- `/public` - Static assets

## Technologies

- Next.js 16
- React 19
- TypeScript
- Prisma ORM
- SQLite Database
- Tailwind CSS
- Shadcn/ui Components
- Zustand (State Management)
