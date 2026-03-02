# Quick Reference: Authentication & Database Setup

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
npm run db:setup
```

This runs:
- `npx prisma generate` - Generate Prisma Client
- `npx prisma db push` - Create database tables
- `npx prisma db seed` - Add test data

### 3. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

---

## 🔐 Testing Authentication

### Test Account (After db:setup)
- **Email:** alice@bsky.app
- **Password:** password123

### Create New Account
1. Click "Sign up" on the login page
2. Fill in the form
3. Click submit

### API Endpoints

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"handle":"alice@bsky.app","password":"password123"}'
```

#### Get Current User
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"handle":"newuser","email":"new@example.com","password":"password123"}'
```

#### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🗄️ Database Management

### View Database in Browser
```bash
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555

### Reset Database (Delete All Data)
```bash
npx prisma migrate reset
```

### Generate Prisma Client (if schema changes)
```bash
npm run db:generate
```

### Push Schema Changes
```bash
npm run db:push
```

### View Database Tables
```bash
npx prisma db execute --stdin
# Then type: \dt
# Then type: \q
```

---

## ⚠️ Common Issues & Fixes

### "Internal Server Error" on Login/Signup

**Fix:**
```bash
npm run db:setup
npm run dev
```

### "relation 'User' does not exist"

**Fix:**
```bash
npx prisma generate
npx prisma db push --skip-generate
npm run dev
```

### Database Connection Failed

**Check:**
1. `.env.local` file exists
2. `DATABASE_URL` is valid (check https://console.neon.tech)
3. Neon project is active

**Reset Connection:**
```bash
npm run db:setup
```

---

## 📋 Useful Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run lint` | Check code quality |
| `npm run db:setup` | Initialize database |
| `npm run db:studio` | Open database viewer |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Update database schema |
| `npm run db:seed` | Add test data |
| `npm run db:reset` | Reset database (deletes data) |

---

## 🔧 Authentication Architecture

### How It Works

1. **Signup:** User creates account → Password hashed with bcrypt → User stored in database
2. **Login:** User enters credentials → Password verified → Session created → Token returned
3. **Protected Routes:** Request includes token → Token validated → User retrieved

### Session Management

- Sessions stored in `Session` table
- Token format: Base64(`{userId}:{timestamp}`)
- Default expiration: 30 days
- Tokens can be passed via:
  - `Authorization: Bearer <token>` header
  - `token` cookie

### Password Security

- Minimum 8 characters
- Hashed with bcrypt (10 salt rounds)
- Never stored in plain text
- Compared during login for verification

---

## 📖 Documentation Files

- **AUTH_TROUBLESHOOTING.md** - Detailed troubleshooting guide
- **DATABASE_SETUP_GUIDE.md** - Database configuration guide
- **NEON_SETUP.md** - Neon-specific setup guide

---

## 🌐 Environment Variables

Required in `.env.local`:
```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

This is your Neon PostgreSQL connection string from https://console.neon.tech

---

## 🛡️ Security Notes

- Passwords are hashed with bcrypt before storage
- Sessions are database-backed (not JWT tokens)
- Use HTTPS in production
- Store sensitive data in environment variables
- Never commit `.env.local` to git

---

## 📞 Need Help?

1. Check **AUTH_TROUBLESHOOTING.md** for common issues
2. Review server logs (they include `[v0]` prefixed messages)
3. Open Neon console: https://console.neon.tech
4. Check database status with `npm run db:studio`

---

## ✅ Setup Checklist

- [ ] Run `npm install`
- [ ] Run `npm run db:setup`
- [ ] Run `npm run dev`
- [ ] Visit http://localhost:3000
- [ ] Test login with alice@bsky.app / password123
- [ ] Test signup with new account
- [ ] Check console for `[v0]` error messages if issues occur
