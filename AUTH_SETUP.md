# Authentication Setup Guide

## Overview

This project includes a complete custom authentication system built with:
- **Backend**: Node.js API routes with bcrypt password hashing
- **Frontend**: React components with Zustand state management
- **Database**: PostgreSQL (Neon) for user storage
- **Sessions**: Secure HTTP-only cookies

## Architecture

### Authentication Flow

1. **Login**: User submits credentials → API validates → Session created
2. **Session**: HTTP-only cookie stores session token → Auto-renewed
3. **Protected Routes**: User context checked via `/api/auth/me` endpoint
4. **Logout**: Session revoked → Cookie cleared

## API Endpoints

### POST /api/auth/signup

Register a new user account.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe",
  "handle": "johndoe"
}
```

**Response** (200):
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "displayName": "John Doe",
  "handle": "johndoe"
}
```

### POST /api/auth/login

Log in with email and password.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200):
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "displayName": "John Doe",
  "handle": "johndoe"
}
```

Sets HTTP-only cookie with session token.

### GET /api/auth/me

Get current user information (requires authentication).

**Response** (200):
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "displayName": "John Doe",
  "handle": "johndoe",
  "verified": false,
  "createdAt": "2026-03-02T14:30:00Z"
}
```

### POST /api/auth/logout

Log out current user and clear session.

**Response** (200):
```json
{
  "success": true
}
```

## Frontend Components

### AuthPage Component

Main authentication interface with login and signup forms.

```typescript
import { AuthPage } from '@/components/bsky/AuthPage';

export default function Home() {
  return <AuthPage />;
}
```

### useAuthStore Hook

Access authentication state and actions.

```typescript
import { useAuthStore } from '@/store';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user?.displayName}</div>;
}
```

## Protected Routes

Protect routes by checking authentication state:

```typescript
'use client';

import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated]);

  return <div>Protected content</div>;
}
```

## Session Management

### Session Storage

Sessions are stored in the `Session` table:

```sql
CREATE TABLE Session (
  id STRING PRIMARY KEY,
  sessionToken STRING UNIQUE,
  userId STRING,
  expires DATETIME,
  createdAt DATETIME DEFAULT NOW(),
  
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);
```

### Session Expiration

- Default session duration: 30 days
- Sessions are automatically renewed on each request
- Expired sessions are automatically cleaned up

### Cookie Configuration

```typescript
{
  httpOnly: true,      // Not accessible via JavaScript
  secure: true,        // HTTPS only in production
  sameSite: 'lax',     // CSRF protection
  maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
}
```

## Password Security

### Password Hashing

Passwords are hashed using bcrypt with:
- Algorithm: bcryptjs
- Salt rounds: 10
- Never stored in plain text

### Password Validation

- Minimum 8 characters recommended
- No character restrictions (numbers, symbols optional)
- Validated on both frontend and backend

## User Registration

When a user signs up:

1. **Validation**: Email and handle uniqueness checked
2. **Hashing**: Password hashed with bcrypt
3. **Database**: User created with hashed password
4. **Session**: Automatic login after registration
5. **Profile**: Default values set (no avatar, verified=false)

## Test Accounts

After running `npm run db:setup`, the following accounts are available:

| Email | Password | Handle | Verified |
|-------|----------|--------|----------|
| alice@bsky.app | password123 | alice | Yes |
| bob@bsky.app | password123 | bob | No |
| charlie@bsky.app | password123 | charlie | Yes |

## Security Best Practices

### What We Do

✅ Hash passwords with bcrypt
✅ Use HTTP-only cookies for sessions
✅ Validate input on both frontend and backend
✅ Protect against CSRF attacks
✅ Validate session tokens
✅ Auto-expire sessions
✅ Clear cookies on logout

### What You Should Do

1. **Environment Variables**: Keep DATABASE_URL secret
2. **HTTPS Only**: Use HTTPS in production
3. **Regular Updates**: Keep dependencies updated
4. **Monitoring**: Log authentication events
5. **Rate Limiting**: Consider rate limiting login attempts
6. **2FA**: Implement two-factor authentication for sensitive accounts

## Customization

### Custom Login Logic

To add custom logic (e.g., IP tracking, login notifications):

1. Edit `/src/app/api/auth/login/route.ts`
2. Add your logic after password verification
3. Log events for monitoring

### Custom User Fields

To add custom user fields:

1. Update Prisma schema in `prisma/schema.prisma`
2. Add field to User model
3. Run `npm run db:migrate`
4. Update API endpoints

### OAuth Integration

To add OAuth (Google, GitHub):

1. Create OAuth app with provider
2. Add environment variables for credentials
3. Implement OAuth flow in new API routes
4. Update signup form to include OAuth buttons

## Debugging

### Enable Debug Logging

Add debug logging to auth endpoints:

```typescript
console.log('[auth]', 'Login attempt:', email);
console.log('[auth]', 'Session created:', sessionId);
```

### Check Session

Verify current session:

```bash
# Browser console
fetch('/api/auth/me')
  .then(r => r.json())
  .then(console.log)
```

### Clear Sessions

Reset all sessions (development only):

```bash
npm run db:reset
npm run db:setup
```

## Support & Resources

- [Prisma Authentication Guide](https://www.prisma.io/docs/concepts/components/prisma-client/auth)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)

## Troubleshooting

### "Invalid credentials" on login

- Check that email and password match in database
- Verify password was hashed correctly
- Check session token validation

### Session expires too quickly

- Verify maxAge configuration in cookie settings
- Check database for expired sessions
- Review session creation timestamp

### Can't sign up with email

- Verify email is unique in database
- Check email format validation
- Review database constraints

### Logout not working

- Clear browser cookies manually
- Check session deletion in database
- Verify logout API endpoint returns success
