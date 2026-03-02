import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token =
      authHeader?.replace('Bearer ', '') || request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await sql`DELETE FROM sessions WHERE session_token = ${token}`

    const response = NextResponse.json({ success: true })
    response.cookies.delete('token')
    return response
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[v0] Logout error:', msg)
    return NextResponse.json({ error: 'Logout failed', details: msg }, { status: 500 })
  }
}
