import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handle, email, password, displayName } = body;

    // Validation
    if (!handle || !email || !password) {
      return NextResponse.json(
        { error: 'Handle, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email },
          { handle }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: existingUser.email === email ? 'Email already in use' : 'Handle already taken' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        handle: handle.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        displayName: displayName || null
      }
    });

    // Generate session token
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    // Create session
    await db.session.create({
      data: {
        sessionToken: token,
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        handle: user.handle,
        displayName: user.displayName,
        avatar: user.avatar,
        banner: user.banner,
        bio: user.bio,
        website: user.website,
        verified: user.verified,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      },
      token
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[v0] Signup error:', errorMessage);
    console.error('[v0] Full error:', error);
    
    // Provide more specific error messages for debugging
    if (errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Database connection failed. Please ensure Neon database is initialized.' },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database schema not initialized. Run: npm run db:setup' },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes('unique constraint')) {
      return NextResponse.json(
        { error: 'Email or handle already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
