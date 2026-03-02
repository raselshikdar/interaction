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

// GET - Get unread counts for notifications and messages
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get unread notifications count
    const unreadNotifications = await db.notification.count({
      where: { 
        userId: user.id, 
        read: false 
      }
    });

    // Get unread messages count
    const unreadMessages = await db.message.count({
      where: { 
        receiverId: user.id, 
        read: false 
      }
    });

    return NextResponse.json({ 
      notifications: unreadNotifications,
      messages: unreadMessages,
      total: unreadNotifications + unreadMessages
    });
  } catch (error) {
    console.error('Get unread counts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
