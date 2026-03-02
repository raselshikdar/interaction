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

    const mutes = await sql`
      SELECT m.id, m.created_at AS muted_at,
             u.id AS uid, u.handle, u.display_name, u.avatar
      FROM mutes m
      JOIN users u ON u.id = m.muted_id
      WHERE m.user_id = ${currentUser.id}
      ORDER BY m.created_at DESC
    `

    return NextResponse.json({
      mutes: mutes.map((m: Record<string, unknown>) => ({
        id: m.id,
        mutedAt: m.muted_at,
        user: { id: m.uid, handle: m.handle, displayName: m.display_name, avatar: m.avatar },
      })),
    })
  } catch (error) {
    console.error('Get mutes error:', error)
    return NextResponse.json({ error: 'Failed to fetch muted users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId: mutedId } = await request.json()
    if (!mutedId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    if (mutedId === currentUser.id) return NextResponse.json({ error: 'Cannot mute yourself' }, { status: 400 })

    const [target] = await sql`SELECT id FROM users WHERE id = ${mutedId} LIMIT 1`
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    await sql`
      INSERT INTO mutes (id, user_id, muted_id)
      VALUES (${uuidv4()}, ${currentUser.id}, ${mutedId})
      ON CONFLICT (user_id, muted_id) DO NOTHING
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mute user error:', error)
    return NextResponse.json({ error: 'Failed to mute user' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mutedId = searchParams.get('userId')
    if (!mutedId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    await sql`DELETE FROM mutes WHERE user_id = ${currentUser.id} AND muted_id = ${mutedId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unmute user error:', error)
    return NextResponse.json({ error: 'Failed to unmute user' }, { status: 500 })
  }
}
