# Quick Start Guide - Setup Database & Authentication

## Overview

This is a full-featured social media application (Bluesky clone) built with Next.js, Prisma, and SQLite. The application includes complete user authentication and a comprehensive database schema for posts, follows, notifications, and more.

## Prerequisites

- Node.js 18+ installed
- npm, yarn, or bun package manager
- Git (already cloned)

## One-Step Setup

Run this single command to set up everything:

```bash
npm run db:setup
```

This command will:
1. Create `.env.local` with database configuration
2. Install all dependencies
3. Generate the Prisma client
4. Create the SQLite database and tables
5. Seed the database with sample data

**That's it! Your app is ready to run.**

## Start Development Server

Once setup is complete, start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Test Account Credentials

After setup, you can log in with any of these test accounts (all use password: `password123`):

| Handle | Email | Followers | Bio |
|--------|-------|-----------|-----|
| alice | alice@bsky.app | 1,250 | Tech enthusiast \| Open source advocate |
| bob | bob@bsky.app | 542 | Designer & Developer |
| charlie | charlie@bsky.app | 3,200 | Music lover \| Coffee addict |
| diana | diana@bsky.app | 890 | Science communicator |
| edward | edward@bsky.app | 4,500 | Photographer \| Traveler \| Storyteller |

**Password for all test accounts:** `password123`

## Authentication System

### How Authentication Works

The app uses a **session-based authentication system** with the following components:

#### 1. **User Database Model**
- Stores user information (handle, email, display name, etc.)
- Passwords are hashed with bcryptjs (not stored in plain text)
- Each user has associated settings, sessions, and content

#### 2. **Authentication Endpoints**

**Login** (`POST /api/auth/login`)
```json
{
  "handle": "alice",  // or email: "alice@bsky.app"
  "password": "password123"
}
```
Returns: `{ user: {...}, token: "session_token" }`

**Sign Up** (`POST /api/auth/signup`)
```json
{
  "handle": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword",
  "displayName": "New User"
}
```
Returns: `{ user: {...}, token: "session_token" }`

**Get Current User** (`GET /api/auth/me`)
- Requires: Authorization header with token
- Returns: Current user information

#### 3. **Session Management**
- Sessions are stored in the database
- Each session has a unique token
- Sessions expire after 30 days
- Token can be sent via:
  - `Authorization: Bearer <token>` header
  - `token` cookie

#### 4. **Client-Side Auth Store** (Zustand)
The app uses Zustand for client-side state management:
```typescript
// In any component:
const { user, token, login, logout } = useAuthStore();
```

## Database Schema

The application includes a comprehensive schema with the following tables:

### Core Tables
- **User**: User accounts with profile information
- **Session**: Active user sessions
- **UserSettings**: User preferences and settings

### Content Tables
- **Post**: Social media posts
- **Comment**: Comments on posts
- **Like**: Post likes
- **Repost**: Post reposts/shares
- **Bookmark**: Saved posts

### Social Features
- **Follow**: User follows
- **Notification**: User notifications
- **Message**: Direct messages
- **Block**: Blocked users
- **Mute**: Muted users

### Collections
- **Feed**: Custom feeds
- **List**: User lists
- **ListMember**: Members of lists
- **UserInterest**: User interests/topics

## Database Commands

```bash
# View database schema
npx prisma studio

# Seed database (add test data)
npm run db:seed

# Create migrations
npm run db:migrate

# Reset database (WARNING: deletes all data)
npm run db:reset

# Push schema changes
npm run db:push
```

## Project Structure

```
src/
├── app/
│   ├── api/              # API endpoints
│   │   └── auth/         # Authentication routes
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main page
│   └── globals.css       # Global styles
├── components/
│   ├── bsky/             # Feature components
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── db.ts             # Prisma client
│   └── auth.ts           # Auth utilities
├── store/                # Zustand stores
├── types/                # TypeScript types
└── providers/            # React providers
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Database seeding script
```

## Features Included

- User authentication (login/signup)
- User profiles with bio, avatar, banner
- Create, edit, delete posts
- Like, repost, bookmark posts
- Follow/unfollow users
- Direct messaging
- Notifications
- Custom feeds
- User settings and preferences
- Two-factor authentication (schema ready)
- Content moderation tools
- Muting and blocking
- Real-time features ready

## Environment Variables

The app uses a `.env.local` file created automatically during setup:

```
DATABASE_URL=file:./prisma/dev.db
```

For production, change this to a hosted database like:
- PostgreSQL
- MySQL
- MongoDB

## API Usage Examples

### Login Example
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    handle: 'alice',
    password: 'password123'
  })
});

const { user, token } = await response.json();
localStorage.setItem('token', token);
```

### Create Post Example
```javascript
const response = await fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    content: 'My first post!'
  })
});
```

### Get Current User
```javascript
const response = await fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { user } = await response.json();
```

## Troubleshooting

### "ENOENT: no such file or directory" for database
**Solution:** Run `npm run db:setup` again. The database file needs to be created.

### "Cannot find module" errors
**Solution:** Delete `node_modules` and lock files, then run `npm install` again.

### SQLite locked errors
**Solution:** Close any other processes using the database, or delete `.prisma/` and run `npm run db:setup` again.

### Port 3000 already in use
**Solution:** Change the port in dev command or kill the process using port 3000.

## Next Steps

1. Explore the database schema in `prisma/schema.prisma`
2. Look at API routes in `src/app/api/`
3. Check out the UI components in `src/components/`
4. Test the authentication flow by logging in
5. Create posts, follow users, and try all features

## Support

For more information, see:
- `TROUBLESHOOTING.md` - Detailed troubleshooting guide
- `DATABASE_SETUP.md` - Database configuration details
- `SETUP.md` - Manual setup instructions
- Prisma documentation: https://www.prisma.io/docs/
- Next.js documentation: https://nextjs.org/docs/

Enjoy building!
