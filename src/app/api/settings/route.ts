import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { sql } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let [settings] = await sql`
      SELECT * FROM user_settings WHERE user_id = ${session.userId} LIMIT 1
    `

    if (!settings) {
      const id = uuidv4()
      ;[settings] = await sql`
        INSERT INTO user_settings (id, user_id) VALUES (${id}, ${session.userId}) RETURNING *
      `
    }

    return NextResponse.json({ settings: mapSettings(settings) })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const allowed: Record<string, string> = {
      isPrivate: 'is_private',
      showFollowers: 'show_followers',
      showFollowing: 'show_following',
      allowTagging: 'allow_tagging',
      allowMentions: 'allow_mentions',
      showOnlineStatus: 'show_online_status',
      twoFactorEnabled: 'two_factor_enabled',
      loginAlerts: 'login_alerts',
      pushNotifications: 'push_notifications',
      emailNotifications: 'email_notifications',
      notifyFollows: 'notify_follows',
      notifyLikes: 'notify_likes',
      notifyReposts: 'notify_reposts',
      notifyReplies: 'notify_replies',
      notifyMentions: 'notify_mentions',
      notifyQuotes: 'notify_quotes',
      autoplayVideos: 'autoplay_videos',
      showSensitiveContent: 'show_sensitive_content',
      mediaQuality: 'media_quality',
      reduceMotion: 'reduce_motion',
      theme: 'theme',
      fontSize: 'font_size',
      compactMode: 'compact_mode',
      screenReader: 'screen_reader',
      highContrast: 'high_contrast',
      reduceAnimations: 'reduce_animations',
      language: 'language',
    }

    // Build SET clause safely using parameterized fragments
    const setClauses = Object.entries(body)
      .filter(([key]) => key in allowed)
      .map(([key, val]) => ({ col: allowed[key], val }))

    if (!setClauses.length) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    // Upsert: insert default row if missing, then update
    const id = uuidv4()
    await sql`
      INSERT INTO user_settings (id, user_id) VALUES (${id}, ${session.userId})
      ON CONFLICT (user_id) DO NOTHING
    `

    // We build the update dynamically using a raw parameterized approach
    for (const { col, val } of setClauses) {
      await sql`UPDATE user_settings SET ${sql.unsafe(col)} = ${val} WHERE user_id = ${session.userId}`
    }

    const [settings] = await sql`SELECT * FROM user_settings WHERE user_id = ${session.userId} LIMIT 1`

    return NextResponse.json({ settings: mapSettings(settings) })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

function mapSettings(s: Record<string, unknown>) {
  return {
    id: s.id,
    userId: s.user_id,
    isPrivate: s.is_private,
    showFollowers: s.show_followers,
    showFollowing: s.show_following,
    allowTagging: s.allow_tagging,
    allowMentions: s.allow_mentions,
    showOnlineStatus: s.show_online_status,
    twoFactorEnabled: s.two_factor_enabled,
    loginAlerts: s.login_alerts,
    pushNotifications: s.push_notifications,
    emailNotifications: s.email_notifications,
    notifyFollows: s.notify_follows,
    notifyLikes: s.notify_likes,
    notifyReposts: s.notify_reposts,
    notifyReplies: s.notify_replies,
    notifyMentions: s.notify_mentions,
    notifyQuotes: s.notify_quotes,
    autoplayVideos: s.autoplay_videos,
    showSensitiveContent: s.show_sensitive_content,
    mediaQuality: s.media_quality,
    reduceMotion: s.reduce_motion,
    theme: s.theme,
    fontSize: s.font_size,
    compactMode: s.compact_mode,
    screenReader: s.screen_reader,
    highContrast: s.high_contrast,
    reduceAnimations: s.reduce_animations,
    language: s.language,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  }
}
