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

    // Check if already liked
    const existing = await db.like.findUnique({
      where: { postId_userId: { postId, userId: user.id } }
    });

    if (existing) {
      // Unlike
      await db.like.delete({ where: { id: existing.id } });
      await db.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } }
      });
      return NextResponse.json({ liked: false });
    }

    // Like
    await db.like.create({
      data: { postId, userId: user.id }
    });
    await db.post.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } }
    });

    // Create notification
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });

    if (post && post.authorId !== user.id) {
      await db.notification.create({
        data: {
          type: 'like',
          userId: post.authorId,
          actorId: user.id,
          postId
        }
      });
    }

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
