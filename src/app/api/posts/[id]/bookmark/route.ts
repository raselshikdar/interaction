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

    const [existing] = await sql`
      SELECT id FROM bookmarks WHERE post_id = ${postId} AND user_id = ${user.id} LIMIT 1
    `

    if (existing) {
      await sql`DELETE FROM bookmarks WHERE id = ${existing.id}`
      await sql`UPDATE posts SET bookmark_count = bookmark_count - 1 WHERE id = ${postId}`
      return NextResponse.json({ bookmarked: false })
    }

    await sql`INSERT INTO bookmarks (id, post_id, user_id) VALUES (${uuidv4()}, ${postId}, ${user.id})`
    await sql`UPDATE posts SET bookmark_count = bookmark_count + 1 WHERE id = ${postId}`

    return NextResponse.json({ bookmarked: true })
  } catch (error) {
    console.error('Bookmark error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
