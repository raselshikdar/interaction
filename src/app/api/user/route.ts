import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET /api/user?handle=xxx  — fetch profile by handle
// GET /api/user?search=xxx  — search users by handle/name
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const handle = searchParams.get('handle')
    const search = searchParams.get('search')

    // Search mode
    if (search) {
      if (search.length < 1) return NextResponse.json({ users: [] })
      const users = await sql`
        SELECT id, handle, display_name, avatar
        FROM users
        WHERE handle ILIKE ${'%' + search.toLowerCase() + '%'}
           OR display_name ILIKE ${'%' + search + '%'}
        LIMIT 10
      `
      return NextResponse.json({
        users: users.map((u: Record<string, unknown>) => ({
          id: u.id,
          handle: u.handle,
          displayName: u.display_name,
          avatar: u.avatar,
        })),
      })
    }

    // Profile mode
    if (!handle) return NextResponse.json({ error: 'Handle is required' }, { status: 400 })

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || null
    let currentUserId: string | null = null
    if (token) {
      const rows = await sql`
        SELECT user_id FROM sessions
        WHERE session_token = ${token} AND expires > NOW()
        LIMIT 1
      `
      if (rows.length) currentUserId = rows[0].user_id as string
    }

    let users
    if (currentUserId) {
      users = await sql`
        SELECT
          u.id, u.handle, u.display_name, u.bio, u.avatar, u.banner,
          u.website, u.created_at,
          COUNT(DISTINCT f1.follower_id) AS followers_count,
          COUNT(DISTINCT f2.following_id) AS following_count,
          COUNT(DISTINCT p.id) AS posts_count,
          EXISTS(
            SELECT 1 FROM follows WHERE follower_id = ${currentUserId} AND following_id = u.id
          ) AS is_following
        FROM users u
        LEFT JOIN follows f1 ON f1.following_id = u.id
        LEFT JOIN follows f2 ON f2.follower_id = u.id
        LEFT JOIN posts p ON p.author_id = u.id
        WHERE LOWER(u.handle) = LOWER(${handle})
        GROUP BY u.id
        LIMIT 1
      `
    } else {
      users = await sql`
        SELECT
          u.id, u.handle, u.display_name, u.bio, u.avatar, u.banner,
          u.website, u.created_at,
          COUNT(DISTINCT f1.follower_id) AS followers_count,
          COUNT(DISTINCT f2.following_id) AS following_count,
          COUNT(DISTINCT p.id) AS posts_count,
          false AS is_following
        FROM users u
        LEFT JOIN follows f1 ON f1.following_id = u.id
        LEFT JOIN follows f2 ON f2.follower_id = u.id
        LEFT JOIN posts p ON p.author_id = u.id
        WHERE LOWER(u.handle) = LOWER(${handle})
        GROUP BY u.id
        LIMIT 1
      `
    }

    if (!users.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const u = users[0]

    return NextResponse.json({
      user: {
        id: u.id,
        handle: u.handle,
        displayName: u.display_name,
        bio: u.bio,
        avatar: u.avatar,
        banner: u.banner,
        website: u.website,
        createdAt: u.created_at,
        followersCount: Number(u.followers_count),
        followingCount: Number(u.following_count),
        postsCount: Number(u.posts_count),
        isFollowing: u.is_following,
      },
    })
  } catch (error) {
    console.error('GET /api/user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/user  — update the authenticated user's profile
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { displayName, bio, website, avatar, banner, handle, email, currentPassword, newPassword } = body

    // Password change flow
    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
      const rows = await sql`SELECT password FROM users WHERE id = ${currentUser.id}`
      if (!rows.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      const valid = await bcrypt.compare(currentPassword, rows[0].password as string)
      if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      if (newPassword.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      const hash = await bcrypt.hash(newPassword, 12)
      await sql`UPDATE users SET password = ${hash}, updated_at = NOW() WHERE id = ${currentUser.id}`
      return NextResponse.json({ success: true })
    }

    // Handle / email uniqueness checks
    if (handle && handle !== currentUser.handle) {
      const existing = await sql`SELECT id FROM users WHERE handle = ${handle.toLowerCase()} AND id != ${currentUser.id}`
      if (existing.length) return NextResponse.json({ error: 'Handle already taken' }, { status: 400 })
    }
    if (email && email !== currentUser.email) {
      const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()} AND id != ${currentUser.id}`
      if (existing.length) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    const updated = await sql`
      UPDATE users SET
        display_name = COALESCE(${displayName ?? null}, display_name),
        bio          = COALESCE(${bio ?? null}, bio),
        website      = COALESCE(${website ?? null}, website),
        avatar       = COALESCE(${avatar ?? null}, avatar),
        banner       = COALESCE(${banner ?? null}, banner),
        handle       = COALESCE(${handle ? handle.toLowerCase() : null}, handle),
        email        = COALESCE(${email ? email.toLowerCase() : null}, email),
        updated_at   = NOW()
      WHERE id = ${currentUser.id}
      RETURNING id, handle, display_name, bio, avatar, banner, website, email, created_at
    `

    if (!updated.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const u = updated[0]

    return NextResponse.json({
      user: {
        id: u.id,
        handle: u.handle,
        displayName: u.display_name,
        bio: u.bio,
        avatar: u.avatar,
        banner: u.banner,
        website: u.website,
        email: u.email,
        createdAt: u.created_at,
      },
    })
  } catch (error) {
    console.error('PUT /api/user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/user  — delete the authenticated user's account
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await sql`DELETE FROM users WHERE id = ${currentUser.id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
