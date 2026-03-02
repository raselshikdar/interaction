import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [{ count: unreadNotifications }] = await sql`
      SELECT COUNT(*) AS count FROM notifications
      WHERE user_id = ${user.id} AND read = false
    `

    const [{ count: unreadMessages }] = await sql`
      SELECT COUNT(*) AS count FROM messages
      WHERE receiver_id = ${user.id} AND read = false
    `

    const n = parseInt(String(unreadNotifications), 10)
    const m = parseInt(String(unreadMessages), 10)

    return NextResponse.json({ notifications: n, messages: m, total: n + m })
  } catch (error) {
    console.error('Get unread counts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
