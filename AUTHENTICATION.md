# Authentication System Documentation

## Overview

This application implements a **session-based authentication system** using:
- **Backend:** Node.js/Next.js with Prisma ORM and SQLite
- **Frontend:** React with Zustand for state management
- **Security:** bcryptjs for password hashing, session tokens for authentication

## Architecture

### Authentication Flow

```
User Login Request
       ↓
   POST /api/auth/login
       ↓
Verify credentials against database
       ↓
Generate session token
       ↓
Return token + user data to client
       ↓
Client stores token in memory/localStorage
       ↓
Subsequent requests include token in Authorization header
       ↓
Server validates token against sessions table
       ↓
Request proceeds if valid
```

## Database Schema

### User Table
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  handle        String   @unique
  displayName   String?
  password      String   // bcrypt hashed
  verified      Boolean  @default(false)
  
  // Relationships
  sessions      Session[]
  // ... other fields
}
```

### Session Table
```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## API Endpoints

### 1. Sign Up - `POST /api/auth/signup`

**Request:**
```json
{
  "handle": "john",
  "email": "john@example.com",
  "password": "securepassword123",
  "displayName": "John Doe"
}
```

**Validation:**
- Handle: Must be unique, lowercase
- Email: Must be valid and unique
- Password: Minimum 8 characters
- Display Name: Optional

**Response (200 OK):**
```json
{
  "user": {
    "id": "cuid123",
    "email": "john@example.com",
    "handle": "john",
    "displayName": "John Doe",
    "verified": false,
    "createdAt": "2026-03-02T10:00:00Z"
  },
  "token": "base64_encoded_session_token"
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or validation failed
- `400 Conflict`: Email or handle already exists

**Implementation Details:**
1. Validate all inputs
2. Check for existing user
3. Hash password with bcryptjs (10 salt rounds)
4. Create user in database
5. Create session with 30-day expiration
6. Return user data and token

### 2. Login - `POST /api/auth/login`

**Request:**
```json
{
  "handle": "john",  // or email
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "cuid123",
    "handle": "john",
    "email": "john@example.com",
    "displayName": "John Doe",
    "verified": false
  },
  "token": "base64_encoded_session_token"
}
```

**Error Responses:**
- `400 Bad Request`: Missing handle or password
- `401 Unauthorized`: Invalid credentials

**Implementation Details:**
1. Find user by handle OR email
2. Compare provided password with hashed password
3. Return 401 if not found or password invalid
4. Create new session token
5. Store session in database
6. Return user data and token

### 3. Get Current User - `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <session_token>
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "cuid123",
    "handle": "john",
    "email": "john@example.com",
    "displayName": "John Doe"
  },
  "token": "current_session_token"
}
```

**Error Responses:**
- `401 Unauthorized`: No token provided or token invalid
- `401 Session expired`: Token exists but session has expired

**Implementation Details:**
1. Extract token from Authorization header or cookies
2. Look up session in database
3. Check if session has expired
4. Return user data if valid

## Client-Side Authentication

### Zustand Store (`src/store/index.ts`)

```typescript
const { user, token, isAuthenticated, login, logout } = useAuthStore();

// Login
login(userData, sessionToken);

// Logout
logout();

// Check if authenticated
if (isAuthenticated) {
  // Show protected content
}
```

### Using Token in Requests

```typescript
// Example: Creating a post with authentication
const response = await fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`  // Include token
  },
  body: JSON.stringify({
    content: 'My post content'
  })
});
```

### Protected Routes

Components check authentication and redirect unauthenticated users:

```typescript
'use client';
import { useAuthStore } from '@/store';
import { LoginPage } from '@/components/bsky';

export default function ProtectedPage() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <div>Welcome, {user?.displayName}!</div>;
}
```

## Security Considerations

### Password Hashing

Passwords are hashed using bcryptjs with 10 salt rounds:

```typescript
import bcrypt from 'bcryptjs';

// During signup
const hashedPassword = await bcrypt.hash(password, 10);

// During login
const isValid = await bcrypt.compare(providedPassword, hashedPassword);
```

**Never store plain-text passwords.**

### Session Tokens

Session tokens are:
- Generated as base64-encoded strings: `userId:timestamp`
- Stored in database with expiration time (30 days)
- Validated on each protected request
- Deleted when user logs out

```typescript
// Token generation
const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

// Session creation
await db.session.create({
  data: {
    sessionToken: token,
    userId: user.id,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
});
```

### HTTPS in Production

Always use HTTPS in production to prevent token interception. Never send tokens over unencrypted connections.

### Token Storage

Tokens should be stored securely:
- **Frontend:** Use memory or secure httpOnly cookies (if possible)
- **Never:** Store in localStorage if sensitive operations are performed
- **Better:** Use httpOnly cookies with SameSite protection

Current implementation stores token in Zustand store and localStorage (handled by zustand/middleware persist).

## Logout

When logging out:

```typescript
const handleLogout = async () => {
  // Optional: Invalidate session on server
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // Clear client-side state
  logout();
  router.push('/');
};
```

## Creating Protected API Routes

To create a protected API endpoint:

```typescript
// src/app/api/protected/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Now user is authenticated
  // Proceed with protected operation
  
  return NextResponse.json({ success: true });
}
```

## Testing Authentication

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "alice",
    "password": "password123"
  }'
```

### Test with Token
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Test User Endpoint (Protected)
```bash
curl -X GET http://localhost:3000/api/user \
  -H "Authorization: Bearer <token>"
```

## Best Practices

1. **Always hash passwords** - Never store or transmit plain passwords
2. **Use HTTPS** - Prevent man-in-the-middle attacks
3. **Validate input** - Check all user inputs server-side
4. **Set expiration** - Sessions should expire after reasonable time
5. **Secure cookies** - Use httpOnly and SameSite flags
6. **Rate limiting** - Prevent brute force attacks on login
7. **Refresh tokens** - Implement refresh tokens for long-lived sessions (future improvement)
8. **Logout on all devices** - Option to invalidate all sessions
9. **Two-factor authentication** - Schema is ready, implement in future

## Common Issues

### Issue: "Session expired" error
**Solution:** Session tokens expire after 30 days. User needs to login again.

### Issue: Token not working across requests
**Solution:** Ensure token is included in Authorization header for each request.

### Issue: User able to access protected routes without authentication
**Solution:** Check that protected components check `isAuthenticated` before rendering.

### Issue: Password comparison always fails
**Solution:** Ensure you're using `bcrypt.compare()` not direct string comparison.

## Future Enhancements

1. **Refresh Tokens** - Implement refresh tokens for better security
2. **Two-Factor Authentication** - Database schema ready
3. **OAuth Integration** - Add social login options
4. **Session Management** - Allow users to see and revoke active sessions
5. **Rate Limiting** - Prevent brute force login attempts
6. **Email Verification** - Require email verification before full access
7. **Password Reset** - Secure password reset flow
8. **Activity Logging** - Log login/logout events for security

## Files Reference

- **Core Auth:** `src/lib/auth.ts`
- **Client Store:** `src/store/index.ts`
- **Login Endpoint:** `src/app/api/auth/login/route.ts`
- **Signup Endpoint:** `src/app/api/auth/signup/route.ts`
- **User Check:** `src/app/api/auth/me/route.ts`
- **Database:** `prisma/schema.prisma` (User and Session models)
- **Login UI:** `src/components/bsky/AuthPage.tsx`
- **Database Client:** `src/lib/db.ts`
