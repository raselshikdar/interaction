import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { handle, email, password, displayName } = body

    if (!handle || !email || !password) {
      return NextResponse.json(
        { error: 'Handle, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check existing user
    const existing = await sql`
      SELECT id, email, handle FROM users
      WHERE email = ${email.toLowerCase()} OR handle = ${handle.toLowerCase()}
      LIMIT 1
    `

    if (existing.length > 0) {
      const conflict = existing[0]
      return NextResponse.json(
        { error: conflict.email === email.toLowerCase() ? 'Email already in use' : 'Handle already taken' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = uuidv4()

    const [user] = await sql`
      INSERT INTO users (id, email, handle, display_name, password)
      VALUES (${userId}, ${email.toLowerCase()}, ${handle.toLowerCase()}, ${displayName ?? null}, ${hashedPassword})
      RETURNING id, email, handle, display_name, avatar, banner, bio, website,
                verified, followers_count, following_count, posts_count, created_at, updated_at
    `

    // Create session (30-day expiry)
    const token = Buffer.from(`${userId}:${Date.now()}`).toString('base64')
    const sessionId = uuidv4()
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await sql`
      INSERT INTO sessions (id, session_token, user_id, expires)
      VALUES (${sessionId}, ${token}, ${userId}, ${expires})
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
    console.error('[v0] Signup error:', msg)
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 })
  }
}
