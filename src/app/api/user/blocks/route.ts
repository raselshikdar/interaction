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

// GET - Get blocked users
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const blocks = await db.block.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: 'desc' }
    });

    // Get the blocked users' details
    const blockedUserIds = blocks.map(b => b.blockedId);
    const blockedUsers = await db.user.findMany({
      where: { id: { in: blockedUserIds } },
      select: {
        id: true,
        handle: true,
        displayName: true,
        avatar: true
      }
    });

    const result = blocks.map(block => {
      const blockedUser = blockedUsers.find(u => u.id === block.blockedId);
      return {
        id: block.id,
        blockedAt: block.createdAt.toISOString(),
        user: blockedUser ? {
          id: blockedUser.id,
          handle: blockedUser.handle,
          displayName: blockedUser.displayName,
          avatar: blockedUser.avatar
        } : null
      };
    }).filter(b => b.user !== null);

    return NextResponse.json({ blocks: result });
  } catch (error) {
    console.error('Get blocks error:', error);
    return NextResponse.json({ error: 'Failed to fetch blocked users' }, { status: 500 });
  }
}

// POST - Block a user
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId: blockedId } = body;

    if (!blockedId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (blockedId === currentUser.id) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    // Check if user exists
    const userToBlock = await db.user.findUnique({ where: { id: blockedId } });
    if (!userToBlock) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create block (upsert to avoid duplicates)
    const block = await db.block.upsert({
      where: {
        userId_blockedId: {
          userId: currentUser.id,
          blockedId
        }
      },
      update: {},
      create: {
        userId: currentUser.id,
        blockedId
      }
    });

    // Also remove any follow relationship
    await db.follow.deleteMany({
      where: {
        OR: [
          { followerId: currentUser.id, followingId: blockedId },
          { followerId: blockedId, followingId: currentUser.id }
        ]
      }
    });

    return NextResponse.json({ success: true, block });
  } catch (error) {
    console.error('Block user error:', error);
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
  }
}

// DELETE - Unblock a user
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blockedId = searchParams.get('userId');

    if (!blockedId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    await db.block.deleteMany({
      where: {
        userId: currentUser.id,
        blockedId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unblock user error:', error);
    return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 });
  }
}
