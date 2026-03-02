import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const notifications = type === 'mentions'
      ? await sql`
          SELECT
            n.*,
            a.id AS actor_id, a.handle AS actor_handle, a.display_name AS actor_display_name,
            a.avatar AS actor_avatar, a.verified AS actor_verified,
            p.id AS post_id, p.content AS post_content,
            pu.id AS post_author_id, pu.handle AS post_author_handle,
            pu.display_name AS post_author_display_name, pu.avatar AS post_author_avatar
          FROM notifications n
          LEFT JOIN users a ON a.id = n.actor_id
          LEFT JOIN posts p ON p.id = n.post_id
          LEFT JOIN users pu ON pu.id = p.author_id
          WHERE n.user_id = ${user.id} AND n.type = 'mention'
          ORDER BY n.created_at DESC
          LIMIT 50
        `
      : await sql`
          SELECT
            n.*,
            a.id AS actor_id_val, a.handle AS actor_handle, a.display_name AS actor_display_name,
            a.avatar AS actor_avatar, a.verified AS actor_verified,
            p.id AS post_id_val, p.content AS post_content,
            pu.id AS post_author_id, pu.handle AS post_author_handle,
            pu.display_name AS post_author_display_name, pu.avatar AS post_author_avatar
          FROM notifications n
          LEFT JOIN users a ON a.id = n.actor_id
          LEFT JOIN posts p ON p.id = n.post_id
          LEFT JOIN users pu ON pu.id = p.author_id
          WHERE n.user_id = ${user.id}
          ORDER BY n.created_at DESC
          LIMIT 50
        `

    return NextResponse.json({
      notifications: notifications.map((n: Record<string, unknown>) => ({
        id: n.id,
        type: n.type,
        userId: n.user_id,
        actorId: n.actor_id,
        postId: n.post_id,
        read: n.read,
        createdAt: n.created_at,
        actor: n.actor_id ? {
          id: n.actor_id_val ?? n.actor_id,
          handle: n.actor_handle,
          displayName: n.actor_display_name,
          avatar: n.actor_avatar,
          verified: n.actor_verified,
        } : null,
        post: n.post_id ? {
          id: n.post_id_val ?? n.post_id,
          content: n.post_content,
          author: {
            id: n.post_author_id,
            handle: n.post_author_handle,
            displayName: n.post_author_display_name,
            avatar: n.post_author_avatar,
          },
        } : null,
      })),
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, all } = body

    if (all) {
      await sql`UPDATE notifications SET read = true WHERE user_id = ${user.id} AND read = false`
    } else if (id) {
      await sql`UPDATE notifications SET read = true WHERE id = ${id}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
