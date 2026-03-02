import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
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

    // Delete session
    await db.session.deleteMany({
      where: { sessionToken: token }
    });

    const response = NextResponse.json({ success: true });
    response.cookies.delete('token');
    
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[v0] Logout error:', errorMessage);
    console.error('[v0] Full error:', error);
    
    return NextResponse.json(
      { error: 'Logout failed', details: errorMessage },
      { status: 500 }
    );
  }
}
