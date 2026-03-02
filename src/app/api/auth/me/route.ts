import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find session
    const session = await db.session.findUnique({
      where: { sessionToken: token },
      include: { user: true }
    });

    if (!session || session.expires < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        handle: session.user.handle,
        displayName: session.user.displayName,
        avatar: session.user.avatar,
        banner: session.user.banner,
        bio: session.user.bio,
        website: session.user.website,
        verified: session.user.verified,
        followersCount: session.user.followersCount,
        followingCount: session.user.followingCount,
        postsCount: session.user.postsCount,
        createdAt: session.user.createdAt.toISOString(),
        updatedAt: session.user.updatedAt.toISOString()
      },
      token
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
