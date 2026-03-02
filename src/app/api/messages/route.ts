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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      // Get messages with specific user
      const messages = await db.message.findMany({
        where: {
          OR: [
            { senderId: user.id, receiverId: userId },
            { senderId: userId, receiverId: user.id }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              handle: true,
              displayName: true,
              avatar: true
            }
          },
          receiver: {
            select: {
              id: true,
              handle: true,
              displayName: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Mark messages as read when fetching
      await db.message.updateMany({
        where: {
          senderId: userId,
          receiverId: user.id,
          read: false
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });

      return NextResponse.json({ messages });
    }

    // Get all conversations with unread counts
    const sentMessages = await db.message.findMany({
      where: { senderId: user.id },
      include: {
        receiver: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const receivedMessages = await db.message.findMany({
      where: { receiverId: user.id },
      include: {
        sender: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get unread counts per conversation
    const unreadCounts = await db.message.groupBy({
      by: ['senderId'],
      where: {
        receiverId: user.id,
        read: false
      },
      _count: {
        id: true
      }
    });

    const unreadMap = new Map(
      unreadCounts.map(u => [u.senderId, u._count.id])
    );

    // Group by conversation partner
    const conversations = new Map();
    
    [...sentMessages, ...receivedMessages].forEach(msg => {
      const partnerId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === user.id ? msg.receiver : msg.sender;
      
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, {
          partner,
          lastMessage: msg,
          unreadCount: unreadMap.get(partnerId) || 0
        });
      }
    });

    return NextResponse.json({ 
      conversations: Array.from(conversations.values()) 
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content, imageUrl, imageAlt } = body;

    if (!receiverId || (!content?.trim() && !imageUrl)) {
      return NextResponse.json({ error: 'Receiver and content/image required' }, { status: 400 });
    }

    const message = await db.message.create({
      data: {
        senderId: user.id,
        receiverId,
        content: content?.trim() || '',
        imageUrl,
        imageAlt
      },
      include: {
        sender: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatar: true
          }
        }
      }
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { partnerId } = body;

    if (!partnerId) {
      return NextResponse.json({ error: 'PartnerId required' }, { status: 400 });
    }

    await db.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: user.id,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark messages read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
