import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { sql } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (userId) {
      const messages = await sql`
        SELECT
          m.*,
          s.id AS sender_id_val, s.handle AS sender_handle,
          s.display_name AS sender_display_name, s.avatar AS sender_avatar,
          r.id AS receiver_id_val, r.handle AS receiver_handle,
          r.display_name AS receiver_display_name, r.avatar AS receiver_avatar
        FROM messages m
        JOIN users s ON s.id = m.sender_id
        JOIN users r ON r.id = m.receiver_id
        WHERE (m.sender_id = ${user.id} AND m.receiver_id = ${userId})
           OR (m.sender_id = ${userId} AND m.receiver_id = ${user.id})
        ORDER BY m.created_at ASC
      `

      // Mark incoming messages as read
      await sql`
        UPDATE messages SET read = true, read_at = NOW()
        WHERE sender_id = ${userId} AND receiver_id = ${user.id} AND read = false
      `

      return NextResponse.json({
        messages: messages.map((m: Record<string, unknown>) => ({
          id: m.id,
          content: m.content,
          senderId: m.sender_id,
          receiverId: m.receiver_id,
          read: m.read,
          readAt: m.read_at,
          imageUrl: m.image_url,
          imageAlt: m.image_alt,
          createdAt: m.created_at,
          sender: { id: m.sender_id_val, handle: m.sender_handle, displayName: m.sender_display_name, avatar: m.sender_avatar },
          receiver: { id: m.receiver_id_val, handle: m.receiver_handle, displayName: m.receiver_display_name, avatar: m.receiver_avatar },
        })),
      })
    }

    // Get all conversations
    const convRows = await sql`
      SELECT DISTINCT ON (partner_id)
        partner_id,
        partner_handle,
        partner_display_name,
        partner_avatar,
        last_content,
        last_created_at,
        unread_count
      FROM (
        SELECT
          CASE WHEN m.sender_id = ${user.id} THEN m.receiver_id ELSE m.sender_id END AS partner_id,
          CASE WHEN m.sender_id = ${user.id} THEN r.handle ELSE s.handle END AS partner_handle,
          CASE WHEN m.sender_id = ${user.id} THEN r.display_name ELSE s.display_name END AS partner_display_name,
          CASE WHEN m.sender_id = ${user.id} THEN r.avatar ELSE s.avatar END AS partner_avatar,
          m.content AS last_content,
          m.created_at AS last_created_at,
          (SELECT COUNT(*) FROM messages um
           WHERE um.sender_id = CASE WHEN m.sender_id = ${user.id} THEN m.receiver_id ELSE m.sender_id END
             AND um.receiver_id = ${user.id}
             AND um.read = false) AS unread_count
        FROM messages m
        JOIN users s ON s.id = m.sender_id
        JOIN users r ON r.id = m.receiver_id
        WHERE m.sender_id = ${user.id} OR m.receiver_id = ${user.id}
        ORDER BY m.created_at DESC
      ) sub
      ORDER BY partner_id, last_created_at DESC
    `

    return NextResponse.json({
      conversations: convRows.map((c: Record<string, unknown>) => ({
        partner: { id: c.partner_id, handle: c.partner_handle, displayName: c.partner_display_name, avatar: c.partner_avatar },
        lastMessage: { content: c.last_content, createdAt: c.last_created_at },
        unreadCount: parseInt(String(c.unread_count), 10),
      })),
    })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { receiverId, content, imageUrl, imageAlt } = body

    if (!receiverId || (!content?.trim() && !imageUrl)) {
      return NextResponse.json({ error: 'Receiver and content/image required' }, { status: 400 })
    }

    const msgId = uuidv4()
    const [message] = await sql`
      INSERT INTO messages (id, sender_id, receiver_id, content, image_url, image_alt)
      VALUES (${msgId}, ${user.id}, ${receiverId}, ${content?.trim() || ''}, ${imageUrl ?? null}, ${imageAlt ?? null})
      RETURNING *
    `

    const [sender] = await sql`SELECT id, handle, display_name, avatar FROM users WHERE id = ${user.id}`
    const [receiver] = await sql`SELECT id, handle, display_name, avatar FROM users WHERE id = ${receiverId}`

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        senderId: message.sender_id,
        receiverId: message.receiver_id,
        read: message.read,
        readAt: message.read_at,
        imageUrl: message.image_url,
        imageAlt: message.image_alt,
        createdAt: message.created_at,
        sender: { id: sender.id, handle: sender.handle, displayName: sender.display_name, avatar: sender.avatar },
        receiver: { id: receiver.id, handle: receiver.handle, displayName: receiver.display_name, avatar: receiver.avatar },
      },
    })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { partnerId } = body

    if (!partnerId) {
      return NextResponse.json({ error: 'PartnerId required' }, { status: 400 })
    }

    await sql`
      UPDATE messages SET read = true, read_at = NOW()
      WHERE sender_id = ${partnerId} AND receiver_id = ${user.id} AND read = false
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark messages read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
