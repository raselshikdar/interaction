import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { sql } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

function formatUser(u: Record<string, unknown>) {
  return {
    id: u.id,
    email: u.email,
    handle: u.handle,
    displayName: u.display_name,
    avatar: u.avatar,
    banner: u.banner,
    bio: u.bio,
    website: u.website,
    verified: u.verified,
    followersCount: u.followers_count,
    followingCount: u.following_count,
    postsCount: u.posts_count,
    createdAt: u.author_created_at ?? u.created_at,
    updatedAt: u.author_updated_at ?? u.updated_at,
  }
}

function formatPost(p: Record<string, unknown>) {
  return {
    id: p.id,
    content: p.content,
    images: p.images ? JSON.parse(p.images as string) : null,
    video: p.video,
    link: p.link,
    linkCard: p.link_card ? JSON.parse(p.link_card as string) : null,
    authorId: p.author_id,
    parentId: p.parent_id,
    replyCount: p.reply_count,
    repostCount: p.repost_count,
    likeCount: p.like_count,
    bookmarkCount: p.bookmark_count,
    isPinned: p.is_pinned,
    isReply: p.is_reply,
    quotePostId: p.quote_post_id,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    author: {
      id: p.author_id,
      email: p.author_email,
      handle: p.author_handle,
      displayName: p.author_display_name,
      avatar: p.author_avatar,
      banner: p.author_banner,
      bio: p.author_bio,
      website: p.author_website,
      verified: p.author_verified,
      followersCount: p.author_followers_count,
      followingCount: p.author_following_count,
      postsCount: p.author_posts_count,
      createdAt: p.author_created_at,
      updatedAt: p.author_updated_at,
    },
    quotePost: p.quote_id
      ? {
          id: p.quote_id,
          content: p.quote_content,
          author: {
            id: p.quote_author_id,
            handle: p.quote_author_handle,
            displayName: p.quote_author_display_name,
            avatar: p.quote_author_avatar,
            verified: p.quote_author_verified,
          },
        }
      : null,
    isLiked: p.is_liked ?? false,
    isReposted: p.is_reposted ?? false,
    isBookmarked: p.is_bookmarked ?? false,
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    const { searchParams } = new URL(request.url)
    const feed = searchParams.get('feed') || 'discover'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')
    const offset = (page - 1) * limit

    let posts: Record<string, unknown>[]

    if (feed === 'hot') {
      posts = await sql`
        SELECT
          p.*,
          u.email AS author_email, u.handle AS author_handle, u.display_name AS author_display_name,
          u.avatar AS author_avatar, u.banner AS author_banner, u.bio AS author_bio,
          u.website AS author_website, u.verified AS author_verified,
          u.followers_count AS author_followers_count, u.following_count AS author_following_count,
          u.posts_count AS author_posts_count, u.created_at AS author_created_at,
          u.updated_at AS author_updated_at,
          qp.id AS quote_id, qp.content AS quote_content,
          qu.id AS quote_author_id, qu.handle AS quote_author_handle,
          qu.display_name AS quote_author_display_name, qu.avatar AS quote_author_avatar,
          qu.verified AS quote_author_verified,
          ${user ? sql`
            (EXISTS (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ${user.id})) AS is_liked,
            (EXISTS (SELECT 1 FROM reposts r WHERE r.post_id = p.id AND r.user_id = ${user.id})) AS is_reposted,
            (EXISTS (SELECT 1 FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = ${user.id})) AS is_bookmarked
          ` : sql`false AS is_liked, false AS is_reposted, false AS is_bookmarked`}
        FROM posts p
        JOIN users u ON u.id = p.author_id
        LEFT JOIN posts qp ON qp.id = p.quote_post_id
        LEFT JOIN users qu ON qu.id = qp.author_id
        WHERE p.parent_id IS NULL
        ORDER BY p.like_count DESC, p.repost_count DESC, p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (feed === 'following' && user) {
      posts = await sql`
        SELECT
          p.*,
          u.email AS author_email, u.handle AS author_handle, u.display_name AS author_display_name,
          u.avatar AS author_avatar, u.banner AS author_banner, u.bio AS author_bio,
          u.website AS author_website, u.verified AS author_verified,
          u.followers_count AS author_followers_count, u.following_count AS author_following_count,
          u.posts_count AS author_posts_count, u.created_at AS author_created_at,
          u.updated_at AS author_updated_at,
          qp.id AS quote_id, qp.content AS quote_content,
          qu.id AS quote_author_id, qu.handle AS quote_author_handle,
          qu.display_name AS quote_author_display_name, qu.avatar AS quote_author_avatar,
          qu.verified AS quote_author_verified,
          (EXISTS (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ${user.id})) AS is_liked,
          (EXISTS (SELECT 1 FROM reposts r WHERE r.post_id = p.id AND r.user_id = ${user.id})) AS is_reposted,
          (EXISTS (SELECT 1 FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = ${user.id})) AS is_bookmarked
        FROM posts p
        JOIN users u ON u.id = p.author_id
        LEFT JOIN posts qp ON qp.id = p.quote_post_id
        LEFT JOIN users qu ON qu.id = qp.author_id
        WHERE p.parent_id IS NULL
          AND p.author_id IN (
            SELECT following_id FROM follows WHERE follower_id = ${user.id}
            UNION SELECT ${user.id}
          )
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (userId) {
      posts = await sql`
        SELECT
          p.*,
          u.email AS author_email, u.handle AS author_handle, u.display_name AS author_display_name,
          u.avatar AS author_avatar, u.banner AS author_banner, u.bio AS author_bio,
          u.website AS author_website, u.verified AS author_verified,
          u.followers_count AS author_followers_count, u.following_count AS author_following_count,
          u.posts_count AS author_posts_count, u.created_at AS author_created_at,
          u.updated_at AS author_updated_at,
          qp.id AS quote_id, qp.content AS quote_content,
          qu.id AS quote_author_id, qu.handle AS quote_author_handle,
          qu.display_name AS quote_author_display_name, qu.avatar AS quote_author_avatar,
          qu.verified AS quote_author_verified,
          ${user ? sql`
            (EXISTS (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ${user.id})) AS is_liked,
            (EXISTS (SELECT 1 FROM reposts r WHERE r.post_id = p.id AND r.user_id = ${user.id})) AS is_reposted,
            (EXISTS (SELECT 1 FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = ${user.id})) AS is_bookmarked
          ` : sql`false AS is_liked, false AS is_reposted, false AS is_bookmarked`}
        FROM posts p
        JOIN users u ON u.id = p.author_id
        LEFT JOIN posts qp ON qp.id = p.quote_post_id
        LEFT JOIN users qu ON qu.id = qp.author_id
        WHERE p.parent_id IS NULL AND p.author_id = ${userId}
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (search) {
      posts = await sql`
        SELECT
          p.*,
          u.email AS author_email, u.handle AS author_handle, u.display_name AS author_display_name,
          u.avatar AS author_avatar, u.banner AS author_banner, u.bio AS author_bio,
          u.website AS author_website, u.verified AS author_verified,
          u.followers_count AS author_followers_count, u.following_count AS author_following_count,
          u.posts_count AS author_posts_count, u.created_at AS author_created_at,
          u.updated_at AS author_updated_at,
          qp.id AS quote_id, qp.content AS quote_content,
          qu.id AS quote_author_id, qu.handle AS quote_author_handle,
          qu.display_name AS quote_author_display_name, qu.avatar AS quote_author_avatar,
          qu.verified AS quote_author_verified,
          ${user ? sql`
            (EXISTS (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ${user.id})) AS is_liked,
            (EXISTS (SELECT 1 FROM reposts r WHERE r.post_id = p.id AND r.user_id = ${user.id})) AS is_reposted,
            (EXISTS (SELECT 1 FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = ${user.id})) AS is_bookmarked
          ` : sql`false AS is_liked, false AS is_reposted, false AS is_bookmarked`}
        FROM posts p
        JOIN users u ON u.id = p.author_id
        LEFT JOIN posts qp ON qp.id = p.quote_post_id
        LEFT JOIN users qu ON qu.id = qp.author_id
        WHERE p.parent_id IS NULL
          AND p.content ILIKE ${'%' + search + '%'}
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      posts = await sql`
        SELECT
          p.*,
          u.email AS author_email, u.handle AS author_handle, u.display_name AS author_display_name,
          u.avatar AS author_avatar, u.banner AS author_banner, u.bio AS author_bio,
          u.website AS author_website, u.verified AS author_verified,
          u.followers_count AS author_followers_count, u.following_count AS author_following_count,
          u.posts_count AS author_posts_count, u.created_at AS author_created_at,
          u.updated_at AS author_updated_at,
          qp.id AS quote_id, qp.content AS quote_content,
          qu.id AS quote_author_id, qu.handle AS quote_author_handle,
          qu.display_name AS quote_author_display_name, qu.avatar AS quote_author_avatar,
          qu.verified AS quote_author_verified,
          ${user ? sql`
            (EXISTS (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ${user.id})) AS is_liked,
            (EXISTS (SELECT 1 FROM reposts r WHERE r.post_id = p.id AND r.user_id = ${user.id})) AS is_reposted,
            (EXISTS (SELECT 1 FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = ${user.id})) AS is_bookmarked
          ` : sql`false AS is_liked, false AS is_reposted, false AS is_bookmarked`}
        FROM posts p
        JOIN users u ON u.id = p.author_id
        LEFT JOIN posts qp ON qp.id = p.quote_post_id
        LEFT JOIN users qu ON qu.id = qp.author_id
        WHERE p.parent_id IS NULL
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return NextResponse.json({ posts: posts.map(formatPost) })
  } catch (error) {
    console.error('Fetch posts error:', error)
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
    const { content, images, parentId, quotePostId } = body

    if (!content?.trim() && (!images || images.length === 0)) {
      return NextResponse.json({ error: 'Post must have content or images' }, { status: 400 })
    }

    const postId = uuidv4()

    const [post] = await sql`
      INSERT INTO posts (id, content, images, author_id, parent_id, quote_post_id, is_reply)
      VALUES (
        ${postId},
        ${content?.trim() || ''},
        ${images && images.length > 0 ? JSON.stringify(images) : null},
        ${user.id},
        ${parentId ?? null},
        ${quotePostId ?? null},
        ${!!parentId}
      )
      RETURNING *
    `

    // Update user post count
    await sql`UPDATE users SET posts_count = posts_count + 1 WHERE id = ${user.id}`

    // Update parent reply count
    if (parentId) {
      await sql`UPDATE posts SET reply_count = reply_count + 1 WHERE id = ${parentId}`
    }

    const [author] = await sql`
      SELECT id, email, handle, display_name, avatar, banner, bio, website,
             verified, followers_count, following_count, posts_count, created_at, updated_at
      FROM users WHERE id = ${user.id}
    `

    return NextResponse.json({
      post: {
        id: post.id,
        content: post.content,
        images: post.images ? JSON.parse(post.images) : null,
        video: post.video,
        link: post.link,
        linkCard: post.link_card ? JSON.parse(post.link_card) : null,
        authorId: post.author_id,
        parentId: post.parent_id,
        replyCount: post.reply_count,
        repostCount: post.repost_count,
        likeCount: post.like_count,
        bookmarkCount: post.bookmark_count,
        isPinned: post.is_pinned,
        isReply: post.is_reply,
        quotePostId: post.quote_post_id,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        author: formatUser(author),
        isLiked: false,
        isReposted: false,
        isBookmarked: false,
      },
    })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
