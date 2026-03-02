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
    const body = await request.json().catch(() => ({}));
    const { content } = body;

    // Check if already reposted
    const existing = await db.repost.findUnique({
      where: { postId_userId: { postId, userId: user.id } }
    });

    if (existing) {
      // Unrepost
      await db.repost.delete({ where: { id: existing.id } });
      await db.post.update({
        where: { id: postId },
        data: { repostCount: { decrement: 1 } }
      });
      return NextResponse.json({ reposted: false });
    }

    // Repost
    await db.repost.create({
      data: { postId, userId: user.id, content }
    });
    await db.post.update({
      where: { id: postId },
      data: { repostCount: { increment: 1 } }
    });

    // Create notification
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    });

    if (post && post.authorId !== user.id) {
      await db.notification.create({
        data: {
          type: 'repost',
          userId: post.authorId,
          actorId: user.id,
          postId
        }
      });
    }

    return NextResponse.json({ reposted: true });
  } catch (error) {
    console.error('Repost error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
