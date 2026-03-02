import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function getCurrentUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: true }
  });

  if (!session || session.expires < new Date()) return null;
  return session.user;
}

// GET - Get muted words
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mutedWords = await db.mutedWord.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      mutedWords: mutedWords.map(mw => ({
        id: mw.id,
        word: mw.word,
        createdAt: mw.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Get muted words error:', error);
    return NextResponse.json({ error: 'Failed to fetch muted words' }, { status: 500 });
  }
}

// POST - Add a muted word
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { word } = body;

    if (!word || typeof word !== 'string') {
      return NextResponse.json({ error: 'Word required' }, { status: 400 });
    }

    const trimmedWord = word.trim().toLowerCase();
    if (trimmedWord.length < 2) {
      return NextResponse.json({ error: 'Word must be at least 2 characters' }, { status: 400 });
    }

    // Create muted word (upsert to avoid duplicates)
    const mutedWord = await db.mutedWord.upsert({
      where: {
        userId_word: {
          userId: currentUser.id,
          word: trimmedWord
        }
      },
      update: {},
      create: {
        userId: currentUser.id,
        word: trimmedWord
      }
    });

    return NextResponse.json({ success: true, mutedWord });
  } catch (error) {
    console.error('Add muted word error:', error);
    return NextResponse.json({ error: 'Failed to add muted word' }, { status: 500 });
  }
}

// DELETE - Remove a muted word
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const wordId = searchParams.get('id');
    const word = searchParams.get('word');

    if (wordId) {
      await db.mutedWord.deleteMany({
        where: {
          id: wordId,
          userId: currentUser.id
        }
      });
    } else if (word) {
      await db.mutedWord.deleteMany({
        where: {
          userId: currentUser.id,
          word: word.toLowerCase()
        }
      });
    } else {
      return NextResponse.json({ error: 'Word ID or word required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove muted word error:', error);
    return NextResponse.json({ error: 'Failed to remove muted word' }, { status: 500 });
  }
}
