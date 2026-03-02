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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });
    }

    if (user.id === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already following
    const existing = await db.follow.findUnique({
      where: { 
        followerId_followingId: { 
          followerId: user.id, 
          followingId: targetUserId 
        } 
      }
    });

    if (existing) {
      // Unfollow
      await db.follow.delete({ where: { id: existing.id } });
      await db.user.update({
        where: { id: user.id },
        data: { followingCount: { decrement: 1 } }
      });
      await db.user.update({
        where: { id: targetUserId },
        data: { followersCount: { decrement: 1 } }
      });
      return NextResponse.json({ following: false });
    }

    // Follow
    await db.follow.create({
      data: { followerId: user.id, followingId: targetUserId }
    });
    await db.user.update({
      where: { id: user.id },
      data: { followingCount: { increment: 1 } }
    });
    await db.user.update({
      where: { id: targetUserId },
      data: { followersCount: { increment: 1 } }
    });

    // Create notification
    await db.notification.create({
      data: {
        type: 'follow',
        userId: targetUserId,
        actorId: user.id
      }
    });

    return NextResponse.json({ following: true });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
