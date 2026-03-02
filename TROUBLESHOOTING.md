# Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Error: SQLITE_CANTOPEN: unable to open database file"

**Cause**: The SQLite database hasn't been initialized yet. The Prisma schema hasn't been pushed to the database.

**Solution**: 
Run the setup script:
```bash
npm run db:setup
```

This will:
1. Create `.env.local` if it doesn't exist
2. Push the Prisma schema to create all tables
3. Generate the Prisma client
4. Seed the database with sample data

### Issue: Development server starts but shows errors about missing database tables

**Cause**: The database schema is out of sync with the Prisma schema.

**Solution**:
```bash
# Option 1: Reset everything
npm run db:reset

# Option 2: Just push the schema changes
npm run db:push
```

### Issue: "Cannot find module '@prisma/client'"

**Cause**: Prisma client hasn't been generated yet.

**Solution**:
```bash
npm run db:generate
```

### Issue: "TypeError: db.user.create is not a function"

**Cause**: The Prisma client wasn't properly initialized or the database tables don't exist.

**Solution**:
1. Make sure the database schema exists: `npm run db:push`
2. Regenerate the Prisma client: `npm run db:generate`
3. Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Issue: "UNIQUE constraint failed: User.email"

**Cause**: You're trying to seed the database when sample users already exist.

**Solution**:
Reset the database first:
```bash
npm run db:reset
```

This will clear all data and let you seed fresh data.

### Issue: Seed script runs but doesn't actually create data

**Cause**: The seed script might have permission issues or the database connection is failing.

**Solution**:
1. Make sure the database file exists: `ls -la prisma/dev.db`
2. Check the .env.local file has the correct DATABASE_URL
3. Try manually pushing and seeding:
   ```bash
   npm run db:push
   npm run db:seed
   ```

### Issue: "Cannot find file: .env.local"

**Cause**: The environment file wasn't created.

**Solution**:
Create it manually:
```bash
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env.local
```

Then run setup:
```bash
npm run db:setup
```

### Issue: Port 3000 is already in use

**Cause**: Another application is using port 3000.

**Solution**:
```bash
# Run on a different port
next dev -p 3001
```

Or kill the process using port 3000:
```bash
# On Mac/Linux
lsof -ti:3000 | xargs kill -9

# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Complete Database Reset

If you're stuck and want to start fresh:

```bash
# Remove the database file
rm prisma/dev.db

# Run full setup
npm run db:setup

# Or if that doesn't work:
npm run db:push
npm run db:seed
```

## Testing Database Connection

To verify the database is working:

```bash
# Open Prisma Studio to inspect the database
npx prisma studio
```

This opens a visual interface where you can see all database records.

## Next.js Development Issues

### Issue: "SyntaxError: Unexpected token"

This is likely a TypeScript or JSX syntax error. The app has `typescript: { ignoreBuildErrors: true }` set intentionally for development, but you should still fix actual syntax errors.

### Issue: Hot reload not working

Try restarting the dev server:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Issue: Import errors for components

Make sure the component files exist and the import paths are correct. All custom components should be in `/src/components/bsky/`.

## Getting Help

If you're still stuck:

1. Check the `.next/` directory was created (indicates Next.js compilation worked)
2. Check that `node_modules/@prisma/client` exists (indicates dependencies are installed)
3. Check the `prisma/dev.db` file exists (indicates database was created)
4. Check `.env.local` exists and contains `DATABASE_URL="file:./prisma/dev.db"`

If all these exist and you're still seeing errors, there may be a more complex issue. Try:

```bash
# Clean everything
rm -rf .next node_modules prisma/dev.db

# Reinstall
npm install

# Setup fresh
npm run db:setup
```

## Performance Issues

If the app feels slow:

1. Check that you're using the dev server (`npm run dev`), not a production build
2. The first request will be slower as Next.js compiles
3. Check browser DevTools to see if there are network/rendering issues

## Database is too large or corrupted

If `prisma/dev.db` gets corrupted or too large:

```bash
# Delete and regenerate
rm prisma/dev.db
npm run db:setup
```

This removes all data but gives you a clean database.
