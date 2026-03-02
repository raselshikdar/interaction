import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Settings API - handles user preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user settings
    let settings = await db.userSettings.findUnique({
      where: { userId: session.userId }
    });

    if (!settings) {
      // Create default settings if not exists
      settings = await db.userSettings.create({
        data: { userId: session.userId }
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate the settings data
    const allowedFields = [
      // Privacy
      'isPrivate', 'showFollowers', 'showFollowing', 'allowTagging', 'allowMentions', 'showOnlineStatus',
      // Security
      'twoFactorEnabled', 'loginAlerts',
      // Notifications
      'pushNotifications', 'emailNotifications', 'notifyFollows', 'notifyLikes', 'notifyReposts', 'notifyReplies', 'notifyMentions', 'notifyQuotes',
      // Content
      'autoplayVideos', 'showSensitiveContent', 'mediaQuality', 'reduceMotion',
      // Appearance
      'theme', 'fontSize', 'compactMode',
      // Accessibility
      'screenReader', 'highContrast', 'reduceAnimations',
      // Language
      'language'
    ];

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      }
    }

    // Upsert settings
    const settings = await db.userSettings.upsert({
      where: { userId: session.userId },
      update: updateData,
      create: {
        userId: session.userId,
        ...updateData
      }
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
