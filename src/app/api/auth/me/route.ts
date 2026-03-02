import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token =
      authHeader?.replace('Bearer ', '') || request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await sql`
      SELECT
        u.id, u.email, u.handle, u.display_name, u.avatar, u.banner,
        u.bio, u.website, u.verified, u.followers_count, u.following_count,
        u.posts_count, u.created_at, u.updated_at,
        s.expires
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.session_token = ${token} AND s.expires > NOW()
      LIMIT 1
    `

    if (!rows.length) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const u = rows[0]

    return NextResponse.json({
      user: {
        id: u.id,
        email: u.email,
        handle: u.handle,
        displayName: u.display_name,
        avatar: u.avatar,
        banner: u.banner,
        bio: u.bio,
        website: u.website,
        verified: u.verified,
        followersCount: u.followers_count,
        followingCount: u.following_count,
        postsCount: u.posts_count,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      },
      token,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[v0] Auth check error:', msg)
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 })
  }
}
