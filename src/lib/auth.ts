import { NextRequest } from 'next/server'
import { sql } from '@/lib/db'

export interface SessionUser {
  id: string
  email: string
  handle: string
  display_name: string | null
  avatar: string | null
  banner: string | null
  bio: string | null
  website: string | null
  verified: boolean
  followers_count: number
  following_count: number
  posts_count: number
  created_at: string
  updated_at: string
}

export interface Session {
  userId: string
  user: SessionUser
  sessionToken: string
}

export async function getSession(request: NextRequest): Promise<Session | null> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) return null

  const rows = await sql`
    SELECT
      s.session_token,
      s.expires,
      u.id,
      u.email,
      u.handle,
      u.display_name,
      u.avatar,
      u.banner,
      u.bio,
      u.website,
      u.verified,
      u.followers_count,
      u.following_count,
      u.posts_count,
      u.created_at,
      u.updated_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.session_token = ${token}
      AND s.expires > NOW()
    LIMIT 1
  `

  if (!rows.length) return null

  const row = rows[0]

  return {
    userId: row.id,
    sessionToken: row.session_token,
    user: {
      id: row.id,
      email: row.email,
      handle: row.handle,
      display_name: row.display_name,
      avatar: row.avatar,
      banner: row.banner,
      bio: row.bio,
      website: row.website,
      verified: row.verified,
      followers_count: row.followers_count,
      following_count: row.following_count,
      posts_count: row.posts_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  }
}

export async function getCurrentUser(request: NextRequest): Promise<SessionUser | null> {
  const session = await getSession(request)
  return session?.user ?? null
}
