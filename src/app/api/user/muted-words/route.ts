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

    const mutedWords = await sql`
      SELECT id, word, created_at FROM muted_words
      WHERE user_id = ${currentUser.id}
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      mutedWords: mutedWords.map((mw: Record<string, unknown>) => ({
        id: mw.id,
        word: mw.word,
        createdAt: mw.created_at,
      })),
    })
  } catch (error) {
    console.error('Get muted words error:', error)
    return NextResponse.json({ error: 'Failed to fetch muted words' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { word } = await request.json()
    if (!word || typeof word !== 'string') {
      return NextResponse.json({ error: 'Word required' }, { status: 400 })
    }

    const trimmed = word.trim().toLowerCase()
    if (trimmed.length < 2) {
      return NextResponse.json({ error: 'Word must be at least 2 characters' }, { status: 400 })
    }

    const [mutedWord] = await sql`
      INSERT INTO muted_words (id, user_id, word)
      VALUES (${uuidv4()}, ${currentUser.id}, ${trimmed})
      ON CONFLICT (user_id, word) DO UPDATE SET word = EXCLUDED.word
      RETURNING *
    `

    return NextResponse.json({ success: true, mutedWord: { id: mutedWord.id, word: mutedWord.word, createdAt: mutedWord.created_at } })
  } catch (error) {
    console.error('Add muted word error:', error)
    return NextResponse.json({ error: 'Failed to add muted word' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const wordId = searchParams.get('id')
    const word = searchParams.get('word')

    if (wordId) {
      await sql`DELETE FROM muted_words WHERE id = ${wordId} AND user_id = ${currentUser.id}`
    } else if (word) {
      await sql`DELETE FROM muted_words WHERE user_id = ${currentUser.id} AND word = ${word.toLowerCase()}`
    } else {
      return NextResponse.json({ error: 'Word ID or word required' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove muted word error:', error)
    return NextResponse.json({ error: 'Failed to remove muted word' }, { status: 500 })
  }
}
