import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { sql } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const blocks = await sql`
      SELECT b.id, b.created_at AS blocked_at,
             u.id AS uid, u.handle, u.display_name, u.avatar
      FROM blocks b
      JOIN users u ON u.id = b.blocked_id
      WHERE b.user_id = ${currentUser.id}
      ORDER BY b.created_at DESC
    `

    return NextResponse.json({
      blocks: blocks.map((b: Record<string, unknown>) => ({
        id: b.id,
        blockedAt: b.blocked_at,
        user: { id: b.uid, handle: b.handle, displayName: b.display_name, avatar: b.avatar },
      })),
    })
  } catch (error) {
    console.error('Get blocks error:', error)
    return NextResponse.json({ error: 'Failed to fetch blocked users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId: blockedId } = await request.json()
    if (!blockedId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    if (blockedId === currentUser.id) return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })

    const [target] = await sql`SELECT id FROM users WHERE id = ${blockedId} LIMIT 1`
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    await sql`
      INSERT INTO blocks (id, user_id, blocked_id)
      VALUES (${uuidv4()}, ${currentUser.id}, ${blockedId})
      ON CONFLICT (user_id, blocked_id) DO NOTHING
    `

    // Remove any follow relationships
    await sql`
      DELETE FROM follows
      WHERE (follower_id = ${currentUser.id} AND following_id = ${blockedId})
         OR (follower_id = ${blockedId} AND following_id = ${currentUser.id})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Block user error:', error)
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const blockedId = searchParams.get('userId')
    if (!blockedId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    await sql`DELETE FROM blocks WHERE user_id = ${currentUser.id} AND blocked_id = ${blockedId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unblock user error:', error)
    return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 })
  }
}
