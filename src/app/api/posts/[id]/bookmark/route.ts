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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;

    // Check if already bookmarked
    const existing = await db.bookmark.findUnique({
      where: { postId_userId: { postId, userId: user.id } }
    });

    if (existing) {
      // Remove bookmark
      await db.bookmark.delete({ where: { id: existing.id } });
      await db.post.update({
        where: { id: postId },
        data: { bookmarkCount: { decrement: 1 } }
      });
      return NextResponse.json({ bookmarked: false });
    }

    // Add bookmark
    await db.bookmark.create({
      data: { postId, userId: user.id }
    });
    await db.post.update({
      where: { id: postId },
      data: { bookmarkCount: { increment: 1 } }
    });

    return NextResponse.json({ bookmarked: true });
  } catch (error) {
    console.error('Bookmark error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
