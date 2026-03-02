import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { handle, password } = body

    if (!handle || !password) {
      return NextResponse.json({ error: 'Handle and password are required' }, { status: 400 })
    }

    const [user] = await sql`
      SELECT id, email, handle, display_name, avatar, banner, bio, website,
             password, verified, followers_count, following_count, posts_count,
             created_at, updated_at
      FROM users
      WHERE handle = ${handle.toLowerCase()} OR email = ${handle.toLowerCase()}
      LIMIT 1
    `

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')
    const sessionId = uuidv4()
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await sql`
      INSERT INTO sessions (id, session_token, user_id, expires)
      VALUES (${sessionId}, ${token}, ${user.id}, ${expires})
    `

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        displayName: user.display_name,
        avatar: user.avatar,
        banner: user.banner,
        bio: user.bio,
        website: user.website,
        verified: user.verified,
        followersCount: user.followers_count,
        followingCount: user.following_count,
        postsCount: user.posts_count,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      token,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[v0] Login error:', msg)
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 })
  }
}
