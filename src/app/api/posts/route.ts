import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to get current user from request
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

// GET - Fetch posts
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const feed = searchParams.get('feed') || 'discover';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');

    const where: any = {
      parentId: null // Only get root posts
    };

    if (userId) {
      where.authorId = userId;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { content: { contains: `#${search}`, mode: 'insensitive' } },
        { content: { contains: `#${search.replace(/\s+/g, '')}`, mode: 'insensitive' } }
      ];
    }

    let orderBy: any = { createdAt: 'desc' };

    if (feed === 'hot') {
      orderBy = [
        { likeCount: 'desc' },
        { repostCount: 'desc' },
        { createdAt: 'desc' }
      ];
    } else if (feed === 'following' && user) {
      // Get following list
      const follows = await db.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true }
      });
      
      where.authorId = { in: [...follows.map(f => f.followingId), user.id] };
    }

    const posts = await db.post.findMany({
      where,
      include: {
        author: true,
        quotePost: {
          include: { author: true }
        },
        likes: user ? {
          where: { userId: user.id },
          select: { id: true }
        } : false,
        reposts: user ? {
          where: { userId: user.id },
          select: { id: true }
        } : false,
        bookmarks: user ? {
          where: { userId: user.id },
          select: { id: true }
        } : false
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      images: post.images ? JSON.parse(post.images) : null,
      video: post.video,
      link: post.link,
      linkCard: post.linkCard ? JSON.parse(post.linkCard) : null,
      authorId: post.authorId,
      parentId: post.parentId,
      replyCount: post.replyCount,
      repostCount: post.repostCount,
      likeCount: post.likeCount,
      bookmarkCount: post.bookmarkCount,
      isPinned: post.isPinned,
      isReply: post.isReply,
      quotePostId: post.quotePostId,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      author: {
        id: post.author.id,
        email: post.author.email,
        handle: post.author.handle,
        displayName: post.author.displayName,
        avatar: post.author.avatar,
        banner: post.author.banner,
        bio: post.author.bio,
        website: post.author.website,
        verified: post.author.verified,
        followersCount: post.author.followersCount,
        followingCount: post.author.followingCount,
        postsCount: post.author.postsCount,
        createdAt: post.author.createdAt.toISOString(),
        updatedAt: post.author.updatedAt.toISOString()
      },
      quotePost: post.quotePost ? {
        id: post.quotePost.id,
        content: post.quotePost.content,
        author: {
          id: post.quotePost.author.id,
          handle: post.quotePost.author.handle,
          displayName: post.quotePost.author.displayName,
          avatar: post.quotePost.author.avatar,
          verified: post.quotePost.author.verified
        }
      } : null,
      isLiked: user ? (post as any).likes?.length > 0 : false,
      isReposted: user ? (post as any).reposts?.length > 0 : false,
      isBookmarked: user ? (post as any).bookmarks?.length > 0 : false
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Fetch posts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a post
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, images, parentId, quotePostId } = body;

    // Allow posts with either content OR images
    if (!content?.trim() && (!images || images.length === 0)) {
      return NextResponse.json(
        { error: 'Post must have content or images' },
        { status: 400 }
      );
    }

    const post = await db.post.create({
      data: {
        content: content?.trim() || '',
        images: images && images.length > 0 ? JSON.stringify(images) : null,
        authorId: user.id,
        parentId: parentId || null,
        quotePostId: quotePostId || null,
        isReply: !!parentId
      },
      include: {
        author: true,
        quotePost: {
          include: { author: true }
        }
      }
    });

    // Update user's post count
    await db.user.update({
      where: { id: user.id },
      data: { postsCount: { increment: 1 } }
    });

    // If it's a reply, update reply count
    if (parentId) {
      await db.post.update({
        where: { id: parentId },
        data: { replyCount: { increment: 1 } }
      });
    }

    return NextResponse.json({
      post: {
        id: post.id,
        content: post.content,
        images: post.images ? JSON.parse(post.images) : null,
        video: post.video,
        link: post.link,
        linkCard: post.linkCard ? JSON.parse(post.linkCard) : null,
        authorId: post.authorId,
        parentId: post.parentId,
        replyCount: post.replyCount,
        repostCount: post.repostCount,
        likeCount: post.likeCount,
        bookmarkCount: post.bookmarkCount,
        isPinned: post.isPinned,
        isReply: post.isReply,
        quotePostId: post.quotePostId,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        author: {
          id: post.author.id,
          email: post.author.email,
          handle: post.author.handle,
          displayName: post.author.displayName,
          avatar: post.author.avatar,
          banner: post.author.banner,
          bio: post.author.bio,
          website: post.author.website,
          verified: post.author.verified,
          followersCount: post.author.followersCount,
          followingCount: post.author.followingCount,
          postsCount: post.author.postsCount,
          createdAt: post.author.createdAt.toISOString(),
          updatedAt: post.author.updatedAt.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
