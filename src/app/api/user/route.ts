import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    if (!search || search.length < 1) {
      return NextResponse.json({ users: [] })
    }

    const users = await sql`
      SELECT id, handle, display_name, avatar
      FROM users
      WHERE handle ILIKE ${'%' + search.toLowerCase() + '%'}
         OR display_name ILIKE ${'%' + search + '%'}
      LIMIT 10
    `

    return NextResponse.json({
      users: users.map((u: Record<string, unknown>) => ({
        id: u.id,
        handle: u.handle,
        displayName: u.display_name,
        avatar: u.avatar,
      })),
    })
  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
