import { sql } from '@/lib/db'

async function checkDatabase() {
  try {
    const users = await sql`SELECT id, handle, email FROM users ORDER BY created_at DESC LIMIT 10`
    console.log('[v0] Users in database:', users)

    const raselUser = await sql`SELECT * FROM users WHERE handle = 'rasel'`
    console.log('[v0] Rasel user:', raselUser)

    const allUsers = await sql`SELECT COUNT(*) FROM users`
    console.log('[v0] Total users:', allUsers[0])
  } catch (error) {
    console.error('[v0] Database check error:', error)
  }
}

checkDatabase()
