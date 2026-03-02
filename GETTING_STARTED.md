# Getting Started

Welcome! This guide will help you get the project up and running with the Neon database and authentication system.

## Prerequisites

- Node.js 18+ (npm or preferred package manager)
- PostgreSQL connection (provided via Neon)

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

The database connection is already configured. Run the setup script to create tables and seed sample data:

```bash
npm run db:setup
```

This will:
- Generate Prisma Client
- Create all database tables in Neon
- Seed the database with sample users and posts

### 3. Start Development Server

```bash
npm run dev
```

The application will start at **http://localhost:3000**

### 4. Login

You can now log in with a test account:

- **Email**: alice@bsky.app
- **Password**: password123

Or create a new account using the signup form!

## What's Included

### Backend Database
- **Neon PostgreSQL** - Serverless PostgreSQL database
- **Prisma ORM** - Type-safe database access
- **Schema** - Pre-configured with 15+ tables

### Authentication
- **Custom Auth System** - Email/password with secure sessions
- **Password Hashing** - bcrypt with salt rounds
- **Session Management** - HTTP-only cookies
- **Protected Routes** - Built-in authentication checks

### Frontend
- **Next.js 16** - React framework
- **Zustand** - State management
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── posts/         # Post CRUD operations
│   │   │   └── users/         # User operations
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── bsky/              # UI components
│   │   └── ui/                # shadcn components
│   ├── lib/
│   │   ├── auth.ts            # Auth utilities
│   │   ├── db.ts              # Prisma client
│   │   └── utils.ts           # Helper functions
│   ├── providers/             # React providers
│   ├── store/                 # Zustand stores
│   └── styles/                # Global styles
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seeding script
├── .env.local                 # Environment variables
├── package.json
└── tsconfig.json
```

## Available Commands

### Development
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database
```bash
npm run db:setup     # Initialize database (one-time)
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema changes to database
npm run db:migrate   # Create a migration
npm run db:seed      # Seed database
npm run db:reset     # Reset database (deletes all data)
```

## Configuration

### Environment Variables

The `.env.local` file contains:

```env
DATABASE_URL=postgresql://...  # Neon database connection
```

Keep this file secret and never commit it to version control.

## Features

### User Management
- ✅ User registration with email/password
- ✅ Secure login with sessions
- ✅ User profiles with display names and handles
- ✅ Avatar and banner images
- ✅ Bio and website fields
- ✅ User verification status

### Social Features
- ✅ Create posts/tweets
- ✅ Comment on posts
- ✅ Like posts
- ✅ Repost/retweet functionality
- ✅ Bookmark posts
- ✅ Follow/unfollow users
- ✅ User profiles with follower counts

### Settings & Privacy
- ✅ User settings management
- ✅ Privacy settings (private account, follower visibility)
- ✅ Notification preferences
- ✅ Content filtering (sensitive content, muted words)
- ✅ Appearance settings (theme, font size)
- ✅ Accessibility options

## Authentication Details

### Login Flow

1. User enters email and password
2. API validates credentials
3. Password verified with bcrypt
4. Session created and stored in database
5. HTTP-only cookie set with session token
6. User logged in and redirected

### Protected Content

Routes and endpoints automatically check for valid sessions. Unauthenticated users are redirected to the login page.

## Database Tables

The Neon database includes:

- **User** - User accounts and profiles
- **UserSettings** - User preferences
- **Post** - Social posts
- **Comment** - Post comments
- **Like** - Post likes
- **Repost** - Reposts/retweets
- **Bookmark** - Saved posts
- **Follow** - Follow relationships
- **Notification** - User notifications
- **Message** - Direct messages
- **Session** - User sessions
- **And more...**

See `prisma/schema.prisma` for complete schema.

## Troubleshooting

### Database Connection Issues

If you get connection errors:

1. Check `.env.local` has valid DATABASE_URL
2. Verify Neon project is active
3. Check network connectivity
4. Review error logs for details

```bash
npm run db:generate  # Test connection
```

### Authentication Issues

If login isn't working:

1. Verify database was seeded: `npm run db:setup`
2. Check that email exists in database
3. Verify password matches (default: password123 for test accounts)
4. Clear browser cookies and try again

### Build Issues

If build fails:

1. Clear cache: `rm -rf .next`
2. Reinstall dependencies: `npm install`
3. Run migrations: `npm run db:setup`
4. Try build again: `npm run build`

## Next Steps

1. **Explore the Code** - Review components and API routes
2. **Customize** - Add your own features and styles
3. **Deploy** - Host on Vercel or your preferred platform
4. **Monitor** - Set up logging and monitoring

## Useful Resources

- **Neon Database**: [NEON_SETUP.md](./NEON_SETUP.md)
- **Authentication**: [AUTH_SETUP.md](./AUTH_SETUP.md)
- **Next.js**: [nextjs.org](https://nextjs.org)
- **Prisma**: [prisma.io](https://prisma.io)
- **Neon**: [neon.tech](https://neon.tech)

## Support

For issues or questions:

1. Check the documentation files in the project
2. Review the code comments and examples
3. Consult framework documentation
4. Check database logs

## What's Next?

You now have:
- ✅ Neon database connected and ready
- ✅ Authentication system configured
- ✅ Development server running
- ✅ Sample data to work with

Start building amazing features! 🚀
