import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to get current user from request
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

// GET - Search users for mentions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    if (!search || search.length < 1) {
      return NextResponse.json({ users: [] });
    }

    // Search users by handle or displayName
    const users = await db.user.findMany({
      where: {
        OR: [
          { handle: { contains: search.toLowerCase() } },
          { displayName: { contains: search, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        handle: true,
        displayName: true,
        avatar: true
      },
      take: 10
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
