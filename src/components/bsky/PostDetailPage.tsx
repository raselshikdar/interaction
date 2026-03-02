'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, MessageCircle, Repeat2, Heart, Bookmark, Share2, MoreHorizontal, Quote } from 'lucide-react';
import { Post, PostSkeleton } from '@/components/bsky/Post';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Post as PostType } from '@/types';

// ── Inline action bar for the expanded main post ────────────────────────────
function ActionBar({
  post,
  onLike,
  onRepost,
  onBookmark,
  onReply,
  onQuote,
}: {
  post: PostType;
  onLike: () => void;
  onRepost: () => void;
  onBookmark: () => void;
  onReply: () => void;
  onQuote: () => void;
}) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isReposted, setIsReposted] = useState(post.isReposted);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [repostCount, setRepostCount] = useState(post.repostCount);

  return (
    <div className="flex items-center justify-between border-t border-border pt-2 mt-2 -mx-1">
      {/* Reply */}
      <button
        className="flex items-center gap-1.5 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground group"
        onClick={onReply}
        aria-label="Reply"
      >
        <MessageCircle className="h-5 w-5 group-hover:text-[#0085ff]" />
        {post.replyCount > 0 && <span className="text-[13px] group-hover:text-[#0085ff]">{post.replyCount}</span>}
      </button>

      {/* Repost */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-1.5 p-2 rounded-full transition-colors',
              isReposted ? 'text-green-500' : 'text-muted-foreground hover:bg-muted'
            )}
            aria-label="Repost"
          >
            <Repeat2 className="h-5 w-5" />
            {repostCount > 0 && <span className="text-[13px]">{repostCount}</span>}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-40">
          <DropdownMenuItem onClick={() => { setIsReposted(!isReposted); setRepostCount(c => isReposted ? c - 1 : c + 1); onRepost(); }}>
            <Repeat2 className="h-4 w-4 mr-2" /> Repost
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onQuote}>
            <Quote className="h-4 w-4 mr-2" /> Quote
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Like */}
      <button
        className={cn(
          'flex items-center gap-1.5 p-2 rounded-full transition-colors',
          isLiked ? 'text-red-500' : 'text-muted-foreground hover:bg-muted'
        )}
        onClick={() => { setIsLiked(!isLiked); setLikeCount(c => isLiked ? c - 1 : c + 1); onLike(); }}
        aria-label="Like"
      >
        <Heart className={cn('h-5 w-5', isLiked && 'fill-current')} />
        {likeCount > 0 && <span className="text-[13px]">{likeCount}</span>}
      </button>

      {/* Bookmark */}
      <button
        className={cn(
          'flex items-center p-2 rounded-full transition-colors',
          isBookmarked ? 'text-[#0085ff]' : 'text-muted-foreground hover:bg-muted'
        )}
        onClick={() => { setIsBookmarked(!isBookmarked); onBookmark(); }}
        aria-label="Bookmark"
      >
        <Bookmark className={cn('h-5 w-5', isBookmarked && 'fill-current')} />
      </button>

      {/* Share */}
      <button
        className="flex items-center p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
        aria-label="Share"
      >
        <Share2 className="h-5 w-5" />
      </button>

      {/* More */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            aria-label="More options"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem>Copy link</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Mute @{post.author.handle}</DropdownMenuItem>
          <DropdownMenuItem className="text-red-500">Report post</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface PostDetailPageProps {
  postId: string;
  token: string | null;
  onBack: () => void;
  onPostClick: (postId: string) => void;
  onAuthorClick: (handle: string) => void;
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onReply: (post: PostType) => void;
  onQuote: (post: PostType) => void;
}

export function PostDetailPage({
  postId,
  token,
  onBack,
  onPostClick,
  onAuthorClick,
  onLike,
  onRepost,
  onBookmark,
  onReply,
  onQuote,
}: PostDetailPageProps) {
  const [post, setPost] = useState<PostType | null>(null);
  const [replies, setReplies] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/posts/${postId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
        setReplies(data.replies || []);
      } else {
        setError('Post not found.');
      }
    } catch {
      setError('Failed to load post.');
    } finally {
      setIsLoading(false);
    }
  }, [postId, token]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-[17px] font-semibold text-foreground">Post</h1>
        </div>
      </div>

      {isLoading ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <p className="text-muted-foreground text-[15px]">{error}</p>
          <button
            onClick={onBack}
            className="mt-4 text-[#0085ff] text-[14px] hover:underline"
          >
            Go back
          </button>
        </div>
      ) : post ? (
        <>
          {/* Main post — rendered in expanded/detail style */}
          <div className="border-b border-border px-4 pt-4 pb-3 bg-background">
            {/* Author row */}
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={() => onAuthorClick(post.author.handle)}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0085ff]"
                aria-label={`View ${post.author.displayName || post.author.handle}'s profile`}
              >
                <Avatar className="h-11 w-11 rounded-full">
                  <AvatarImage
                    src={post.author.avatar || undefined}
                    alt={post.author.displayName || post.author.handle}
                  />
                  <AvatarFallback>
                    {(post.author.displayName || post.author.handle)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
              <div className="flex flex-col min-w-0">
                <button
                  type="button"
                  onClick={() => onAuthorClick(post.author.handle)}
                  className="font-semibold text-[15px] text-foreground hover:underline text-left truncate focus-visible:outline-none"
                >
                  {post.author.displayName || post.author.handle}
                </button>
                <button
                  type="button"
                  onClick={() => onAuthorClick(post.author.handle)}
                  className="text-[14px] text-muted-foreground hover:underline text-left truncate focus-visible:outline-none"
                >
                  @{post.author.handle}
                </button>
              </div>
            </div>

            {/* Full post content */}
            <p className="text-[17px] text-foreground whitespace-pre-wrap break-words leading-[1.5] mb-3">
              {post.content}
            </p>

            {/* Images */}
            {post.images && (
              (() => {
                const imgs = typeof post.images === 'string'
                  ? JSON.parse(post.images)
                  : post.images;
                return imgs.length > 0 ? (
                  <div
                    className={cn(
                      'mb-3 grid gap-0.5 rounded-xl overflow-hidden border border-border',
                      imgs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                    )}
                  >
                    {imgs.map((img: string, idx: number) => (
                      <div key={idx} className="aspect-square relative bg-muted">
                        <img
                          src={img}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : null;
              })()
            )}

            {/* Timestamp */}
            <p className="text-[14px] text-muted-foreground mb-3">
              {new Date(post.createdAt).toLocaleString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>

            {/* Stats row */}
            {(post.repostCount > 0 || post.likeCount > 0 || post.replyCount > 0) && (
              <div className="flex items-center gap-4 py-3 border-t border-border text-[14px]">
                {post.replyCount > 0 && (
                  <span>
                    <strong className="text-foreground">{post.replyCount}</strong>{' '}
                    <span className="text-muted-foreground">
                      {post.replyCount === 1 ? 'Reply' : 'Replies'}
                    </span>
                  </span>
                )}
                {post.repostCount > 0 && (
                  <span>
                    <strong className="text-foreground">{post.repostCount}</strong>{' '}
                    <span className="text-muted-foreground">
                      {post.repostCount === 1 ? 'Repost' : 'Reposts'}
                    </span>
                  </span>
                )}
                {post.likeCount > 0 && (
                  <span>
                    <strong className="text-foreground">{post.likeCount}</strong>{' '}
                    <span className="text-muted-foreground">
                      {post.likeCount === 1 ? 'Like' : 'Likes'}
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Action bar */}
            <ActionBar
              post={post}
              onLike={() => onLike(post.id)}
              onRepost={() => onRepost(post.id)}
              onBookmark={() => onBookmark(post.id)}
              onReply={() => onReply(post)}
              onQuote={() => onQuote(post)}
            />
          </div>

          {/* Replies section */}
          <div>
            {replies.length === 0 ? (
              <div className="flex flex-col items-center py-12 px-4 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-[14px]">No replies yet. Be the first to reply!</p>
              </div>
            ) : (
              replies.map((reply) => (
                <Post
                  key={reply.id}
                  post={reply}
                  onPostClick={onPostClick}
                  onAuthorClick={onAuthorClick}
                  onLike={() => onLike(reply.id)}
                  onRepost={() => onRepost(reply.id)}
                  onBookmark={() => onBookmark(reply.id)}
                  onReply={() => onReply(reply)}
                  onQuote={() => onQuote(reply)}
                />
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
