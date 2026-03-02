# Authentication Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Internal Server Error" on Login/Signup

This typically indicates the database schema hasn't been created.

**Solution:**

1. **Verify DATABASE_URL is set:**
   ```bash
   cat .env.local
   ```
   You should see a valid Neon PostgreSQL connection string.

2. **Run database migrations:**
   ```bash
   npx prisma generate
   npx prisma db push --skip-generate
   ```

3. **Seed the database (optional):**
   ```bash
   npx prisma db seed
   ```

4. **Check the browser console and server logs** for specific error messages.

---

### Issue: "Database relation does not exist"

The Prisma migrations haven't been applied to your Neon database.

**Fix:**
```bash
# Generate Prisma Client
npx prisma generate

# Create all tables in Neon
npx prisma db push --skip-generate

# Verify the schema was created
npx prisma db execute --stdin < /dev/null
```

---

### Issue: "ECONNREFUSED" or Connection Timeout

The application can't connect to the Neon database.

**Check the following:**

1. **Verify DATABASE_URL format:**
   - Should start with `postgresql://`
   - Should contain username, password, host, database name
   - Example: `postgresql://user:password@host/dbname?sslmode=require`

2. **Test the connection:**
   ```bash
   # Install psql (PostgreSQL client)
   # Then test connection:
   psql "postgresql://your-connection-string"
   ```

3. **Check if Neon project is active:**
   - Visit https://console.neon.tech
   - Verify your project status
   - Check if the database exists

---

### Issue: "Unauthorized" Error When Trying to Access `/api/auth/me`

The session token is invalid or expired.

**Solutions:**

1. **Login again** - sessions expire after 30 days
2. **Check if token is being passed correctly:**
   - Should be in `Authorization: Bearer <token>` header
   - Or in `token` cookie

---

### Issue: "Email already in use" on Signup

This error is expected if:
- You're trying to register with an email already in the database
- You just created that account

**Solutions:**
- Use a different email address
- Or login with the existing account

---

## Database Schema Issues

If you encounter Prisma schema issues:

1. **Regenerate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Check for schema conflicts:**
   ```bash
   npx prisma db execute --stdin < /dev/null
   ```

3. **View your current database schema:**
   ```bash
   npx prisma db execute --stdin < <<EOF
   \d
   EOF
   ```

4. **Reset the database (WARNING: Deletes all data):**
   ```bash
   npx prisma migrate reset
   ```

---

## Testing Authentication

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"handle":"alice@bsky.app","password":"password123"}'
```

### Test Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"handle":"newuser","email":"user@example.com","password":"password123"}'
```

### Test Current User
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <your-token-here>"
```

---

## Enable Debug Logging

The auth routes now include detailed error logging. Check your server console for `[v0]` prefixed logs.

**Server logs location:**
- When running `npm run dev`, errors appear in your terminal
- Look for messages starting with `[v0] Login error:` or similar

---

## Complete Setup Checklist

- [ ] Neon project created at https://console.neon.tech
- [ ] `.env.local` file has valid `DATABASE_URL`
- [ ] Ran `npx prisma generate`
- [ ] Ran `npx prisma db push --skip-generate`
- [ ] Dev server running with `npm run dev`
- [ ] Can access http://localhost:3000
- [ ] Can signup/login on the auth page

---

## Getting Help

If issues persist:

1. Check the server console for `[v0]` prefixed error messages
2. Verify your Neon database status at https://console.neon.tech
3. Try restarting the dev server: `npm run dev`
4. Check that all dependencies are installed: `npm install`

---

## API Endpoint Reference

### POST /api/auth/signup
Create a new user account.

**Request:**
```json
{
  "handle": "username",
  "email": "user@example.com",
  "password": "password123",
  "displayName": "User Name" // optional
}
```

**Response:**
```json
{
  "user": { /* user object */ },
  "token": "base64-encoded-session-token"
}
```

### POST /api/auth/login
Login with existing credentials.

**Request:**
```json
{
  "handle": "username or email",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": { /* user object */ },
  "token": "base64-encoded-session-token"
}
```

### GET /api/auth/me
Get current user info (requires valid session token).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": { /* user object */ },
  "token": "session-token"
}
```

### POST /api/auth/logout
Logout and invalidate session token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

---

## Password Requirements

- Minimum 8 characters
- Hashed using bcrypt with 10 salt rounds
- Never stored in plain text

---

## Session Management

- Sessions are stored in the Neon database
- Default expiration: 30 days
- Tokens are base64-encoded: `{userId}:{timestamp}`
- HTTP-only cookies are supported for token storage
