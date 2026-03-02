import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getSession(request);

  try {
    // Fetch the main post with author info
    const postRows = await sql`
      SELECT
        p.*,
        u.id        AS author_id,
        u.handle    AS author_handle,
        u.display_name AS author_display_name,
        u.avatar    AS author_avatar,
        u.verified  AS author_verified,
        u.followers_count AS author_followers_count,
        u.following_count AS author_following_count,
        u.posts_count     AS author_posts_count,
        ${currentUser
          ? sql`
            EXISTS(SELECT 1 FROM likes     WHERE post_id = p.id AND user_id = ${currentUser.id}) AS is_liked,
            EXISTS(SELECT 1 FROM reposts   WHERE post_id = p.id AND user_id = ${currentUser.id}) AS is_reposted,
            EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = ${currentUser.id}) AS is_bookmarked
          `
          : sql`false AS is_liked, false AS is_reposted, false AS is_bookmarked`}
      FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE p.id = ${id}
      LIMIT 1
    `;

    if (!postRows.length) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Fetch replies to this post
    const replyRows = await sql`
      SELECT
        p.*,
        u.id        AS author_id,
        u.handle    AS author_handle,
        u.display_name AS author_display_name,
        u.avatar    AS author_avatar,
        u.verified  AS author_verified,
        u.followers_count AS author_followers_count,
        u.following_count AS author_following_count,
        u.posts_count     AS author_posts_count,
        ${currentUser
          ? sql`
            EXISTS(SELECT 1 FROM likes     WHERE post_id = p.id AND user_id = ${currentUser.id}) AS is_liked,
            EXISTS(SELECT 1 FROM reposts   WHERE post_id = p.id AND user_id = ${currentUser.id}) AS is_reposted,
            EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = ${currentUser.id}) AS is_bookmarked
          `
          : sql`false AS is_liked, false AS is_reposted, false AS is_bookmarked`}
      FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE p.parent_id = ${id}
      ORDER BY p.created_at ASC
    `;

    const mapRow = (row: Record<string, unknown>) => ({
      id: row.id,
      content: row.content,
      images: row.images,
      video: row.video,
      link: row.link,
      linkCard: row.link_card,
      authorId: row.author_id,
      parentId: row.parent_id,
      replyCount: Number(row.reply_count) || 0,
      repostCount: Number(row.repost_count) || 0,
      likeCount: Number(row.like_count) || 0,
      bookmarkCount: Number(row.bookmark_count) || 0,
      isPinned: row.is_pinned,
      isReply: row.is_reply,
      quotePostId: row.quote_post_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isLiked: Boolean(row.is_liked),
      isReposted: Boolean(row.is_reposted),
      isBookmarked: Boolean(row.is_bookmarked),
      author: {
        id: row.author_id,
        handle: row.author_handle,
        displayName: row.author_display_name,
        avatar: row.author_avatar,
        banner: null,
        bio: null,
        website: null,
        verified: Boolean(row.author_verified),
        followersCount: Number(row.author_followers_count) || 0,
        followingCount: Number(row.author_following_count) || 0,
        postsCount: Number(row.author_posts_count) || 0,
        email: '',
        createdAt: '',
        updatedAt: '',
      },
    });

    return NextResponse.json({
      post: mapRow(postRows[0]),
      replies: replyRows.map(mapRow),
    });
  } catch (error) {
    console.error('Post detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
