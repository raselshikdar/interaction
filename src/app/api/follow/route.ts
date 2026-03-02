import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { sql } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { targetUserId } = body

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID required' }, { status: 400 })
    }

    if (user.id === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    const [target] = await sql`SELECT id FROM users WHERE id = ${targetUserId} LIMIT 1`
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const [existing] = await sql`
      SELECT id FROM follows
      WHERE follower_id = ${user.id} AND following_id = ${targetUserId}
      LIMIT 1
    `

    if (existing) {
      // Unfollow
      await sql`DELETE FROM follows WHERE id = ${existing.id}`
      await sql`UPDATE users SET following_count = following_count - 1 WHERE id = ${user.id}`
      await sql`UPDATE users SET followers_count = followers_count - 1 WHERE id = ${targetUserId}`
      return NextResponse.json({ following: false })
    }

    // Follow
    await sql`
      INSERT INTO follows (id, follower_id, following_id)
      VALUES (${uuidv4()}, ${user.id}, ${targetUserId})
    `
    await sql`UPDATE users SET following_count = following_count + 1 WHERE id = ${user.id}`
    await sql`UPDATE users SET followers_count = followers_count + 1 WHERE id = ${targetUserId}`

    // Create notification
    await sql`
      INSERT INTO notifications (id, type, user_id, actor_id)
      VALUES (${uuidv4()}, 'follow', ${targetUserId}, ${user.id})
    `

    return NextResponse.json({ following: true })
  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
