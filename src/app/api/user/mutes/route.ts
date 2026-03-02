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

// GET - Get muted users
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mutes = await db.mute.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: 'desc' }
    });

    // Get the muted users' details
    const mutedUserIds = mutes.map(m => m.mutedId);
    const mutedUsers = await db.user.findMany({
      where: { id: { in: mutedUserIds } },
      select: {
        id: true,
        handle: true,
        displayName: true,
        avatar: true
      }
    });

    const result = mutes.map(mute => {
      const mutedUser = mutedUsers.find(u => u.id === mute.mutedId);
      return {
        id: mute.id,
        mutedAt: mute.createdAt.toISOString(),
        user: mutedUser ? {
          id: mutedUser.id,
          handle: mutedUser.handle,
          displayName: mutedUser.displayName,
          avatar: mutedUser.avatar
        } : null
      };
    }).filter(m => m.user !== null);

    return NextResponse.json({ mutes: result });
  } catch (error) {
    console.error('Get mutes error:', error);
    return NextResponse.json({ error: 'Failed to fetch muted users' }, { status: 500 });
  }
}

// POST - Mute a user
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId: mutedId } = body;

    if (!mutedId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (mutedId === currentUser.id) {
      return NextResponse.json({ error: 'Cannot mute yourself' }, { status: 400 });
    }

    // Check if user exists
    const userToMute = await db.user.findUnique({ where: { id: mutedId } });
    if (!userToMute) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create mute (upsert to avoid duplicates)
    const mute = await db.mute.upsert({
      where: {
        userId_mutedId: {
          userId: currentUser.id,
          mutedId
        }
      },
      update: {},
      create: {
        userId: currentUser.id,
        mutedId
      }
    });

    return NextResponse.json({ success: true, mute });
  } catch (error) {
    console.error('Mute user error:', error);
    return NextResponse.json({ error: 'Failed to mute user' }, { status: 500 });
  }
}

// DELETE - Unmute a user
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mutedId = searchParams.get('userId');

    if (!mutedId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    await db.mute.deleteMany({
      where: {
        userId: currentUser.id,
        mutedId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unmute user error:', error);
    return NextResponse.json({ error: 'Failed to unmute user' }, { status: 500 });
  }
}
