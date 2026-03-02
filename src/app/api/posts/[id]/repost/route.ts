import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { sql } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: postId } = await params
    const body = await request.json().catch(() => ({}))
    const { content } = body

    const [existing] = await sql`
      SELECT id FROM reposts WHERE post_id = ${postId} AND user_id = ${user.id} LIMIT 1
    `

    if (existing) {
      await sql`DELETE FROM reposts WHERE id = ${existing.id}`
      await sql`UPDATE posts SET repost_count = repost_count - 1 WHERE id = ${postId}`
      return NextResponse.json({ reposted: false })
    }

    await sql`
      INSERT INTO reposts (id, post_id, user_id, content)
      VALUES (${uuidv4()}, ${postId}, ${user.id}, ${content ?? null})
    `
    await sql`UPDATE posts SET repost_count = repost_count + 1 WHERE id = ${postId}`

    const [post] = await sql`SELECT author_id FROM posts WHERE id = ${postId} LIMIT 1`
    if (post && post.author_id !== user.id) {
      await sql`
        INSERT INTO notifications (id, type, user_id, actor_id, post_id)
        VALUES (${uuidv4()}, 'repost', ${post.author_id}, ${user.id}, ${postId})
      `
    }

    return NextResponse.json({ reposted: true })
  } catch (error) {
    console.error('Repost error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
