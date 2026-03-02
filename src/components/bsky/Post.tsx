'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Post as PostType } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageCircle,
  Repeat2,
  Heart,
  Bookmark,
  Share2,
  MoreHorizontal,
  Globe,
  Quote
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Short time format function (2s, 5m, 3h, 1d) - EXACT bsky style
function formatShortTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return `${diffSec}s`;
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Render content with highlighted entities
function renderContent(
  content: string,
  onHashtagClick?: (tag: string) => void,
  onMentionClick?: (handle: string) => void
) {
  if (!content) return null;

  const parts: React.ReactNode[] = [];
  const regex = /(#\w+|@\w+|https?:\/\/[^\s]+)/g;
  let lastIndex = 0;
  let key = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{content.slice(lastIndex, match.index)}</span>);
    }

    const entity = match[0];

    if (entity.startsWith('#')) {
      const tag = entity.slice(1);
      parts.push(
        <a
          key={key++}
          href={`/search/${encodeURIComponent(tag)}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onHashtagClick?.(tag);
            router.push(`/search/${encodeURIComponent(tag)}`);
          }}
          className="text-[#0085ff] hover:underline"
        >
          {entity}
        </a>
      );
    } else if (entity.startsWith('@')) {
      const handle = entity.slice(1);
      parts.push(
        <a
          key={key++}
          href={`/profile/${handle}`}
            onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMentionClick?.(handle);
            router.push(`/profile/${handle}`);
          }}
          className="text-[#0085ff] hover:underline"
        >
          {entity}
        </a>
      );
    } else {
      parts.push(
        <a
          key={key++}
          href={entity}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#0085ff] hover:underline"
        >
          {entity.length > 30 ? entity.slice(0, 30) + '...' : entity}
        </a>
      );
    }

    lastIndex = match.index + entity.length;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={key++}>{content.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : content;
}

interface PostProps {
  post: PostType;
  onLike?: () => void;
  onRepost?: () => void;
  onBookmark?: () => void;
  onReply?: () => void;
  onShare?: () => void;
  onQuote?: () => void;
  onPostClick?: (postId: string) => void;
  onAuthorClick?: (handle: string) => void;
  compact?: boolean;
}

export function Post({
  post,
  onLike,
  onRepost,
  onBookmark,
  onReply,
  onQuote,
  onPostClick,
  onAuthorClick,
  compact = false,
}: PostProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isReposted, setIsReposted] = useState(post.isReposted);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [repostCount, setRepostCount] = useState(post.repostCount);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.();
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReposted(!isReposted);
    setRepostCount((prev) => (isReposted ? prev - 1 : prev + 1));
    onRepost?.();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    onBookmark?.();
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReply?.();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.();
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAuthorClick) {
      onAuthorClick(post.author.handle);
    } else {
      router.push(`/profile/${post.author.handle}`);
    }
  };

  const handleCardClick = () => {
    if (onPostClick) {
      onPostClick(post.id);
    } else {
      router.push(`/post/${post.id}`);
    }
  };

  const formattedTime = formatShortTime(new Date(post.createdAt));
  const authorName = post.author.displayName || post.author.handle;
  const images =
    post.images
      ? typeof post.images === 'string'
        ? JSON.parse(post.images)
        : post.images
      : null;

  return (
    <article
      className={cn(
        'border-b border-border bg-background cursor-pointer hover:bg-muted/40 transition-colors',
        compact ? 'p-3' : 'py-3 px-4'
      )}
      onClick={handleCardClick}
    >
      <div className="flex gap-3 items-start">
        {/* Avatar — navigates to author profile */}
        <button
          type="button"
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0085ff]"
          onClick={handleAuthorClick}
          aria-label={`View ${authorName}'s profile`}
        >
          <Avatar className="h-10 w-10 rounded-full">
            <AvatarImage src={post.author.avatar || undefined} alt={authorName} />
            <AvatarFallback>{authorName[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        </button>

        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            {/* Display name — navigates to author profile */}
            <button
              type="button"
              onClick={handleAuthorClick}
              className="font-semibold text-foreground text-[15px] hover:underline truncate focus-visible:outline-none"
            >
              {authorName}
            </button>
            {post.author.verified && (
              <svg
                className="h-4 w-4 text-[#0085ff] shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            )}
            {/* Handle — navigates to author profile */}
            <button
              type="button"
              onClick={handleAuthorClick}
              className="text-muted-foreground text-[15px] truncate hover:underline focus-visible:outline-none"
            >
              @{post.author.handle}
            </button>
            <span className="text-muted-foreground text-[15px]">·</span>
            <span className="text-muted-foreground text-[15px] whitespace-nowrap">
              {formattedTime}
            </span>
          </div>

          {/* Content — clicking opens post detail */}
          <div className="mt-0.5">
            <p className="text-[15px] text-foreground whitespace-pre-wrap break-words leading-[1.35]">
              {renderContent(post.content)}
            </p>
          </div>

          {/* Images */}
          {images && images.length > 0 && (
            <div
              className={cn(
                'mt-2.5 grid gap-0.5 rounded-xl overflow-hidden border border-border',
                images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img: string, idx: number) => (
                <div key={idx} className="aspect-square relative bg-muted">
                  <img
                    src={img}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Link Card */}
          {post.linkCard && (
            <a
              href={post.linkCard.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-2.5 flex border border-border rounded-xl overflow-hidden hover:bg-muted transition-colors"
            >
              {post.linkCard.image && (
                <div className="w-24 h-24 shrink-0 bg-muted">
                  <img
                    src={post.linkCard.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {post.linkCard.title}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {post.linkCard.description}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Globe className="h-3 w-3" />
                  {new URL(post.linkCard.url).hostname}
                </p>
              </div>
            </a>
          )}

          {/* Quote Post */}
          {post.quotePost && (
            <div
              className="mt-2.5 border border-border rounded-xl p-3 hover:bg-muted/60 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (onPostClick) onPostClick(post.quotePost!.id);
                else { router.push(`/post/${post.quotePost!.id}`); }
              }}
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5 rounded-full">
                  <AvatarImage src={post.quotePost.author.avatar || undefined} />
                  <AvatarFallback className="text-xs">
                    {post.quotePost.author.handle[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm text-foreground">
                  {post.quotePost.author.displayName || post.quotePost.author.handle}
                </span>
                <span className="text-muted-foreground text-sm">
                  @{post.quotePost.author.handle}
                </span>
              </div>
              <p className="text-sm text-foreground mt-1 line-clamp-3">
                {post.quotePost.content}
              </p>
            </div>
          )}

          {/* Actions — all stop propagation so they don't trigger card click */}
          <div
            className="flex items-center justify-between mt-2 -ml-1.5 mr-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Comment */}
            <button
              className="flex items-center justify-center gap-1 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground group"
              onClick={handleReply}
              aria-label="Reply"
            >
              <MessageCircle className="h-5 w-5 group-hover:text-[#0085ff]" />
              {post.replyCount > 0 && (
                <span className="text-[13px] group-hover:text-[#0085ff]">
                  {post.replyCount}
                </span>
              )}
            </button>

            {/* Repost */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex items-center justify-center gap-1 p-1.5 rounded-full transition-colors',
                    isReposted
                      ? 'text-green-500'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Repost"
                >
                  <Repeat2 className="h-5 w-5" />
                  {repostCount > 0 && (
                    <span className="text-[13px]">{repostCount}</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-40">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRepost(e as unknown as React.MouseEvent); }}>
                  <Repeat2 className="h-4 w-4 mr-2" />
                  Repost
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onQuote?.(); }}>
                  <Quote className="h-4 w-4 mr-2" />
                  Quote
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Like */}
            <button
              className={cn(
                'flex items-center justify-center gap-1 p-1.5 rounded-full transition-colors',
                isLiked
                  ? 'text-red-500'
                  : 'text-muted-foreground hover:bg-muted'
              )}
              onClick={handleLike}
              aria-label="Like"
            >
              <Heart className={cn('h-5 w-5', isLiked && 'fill-current')} />
              {likeCount > 0 && (
                <span className="text-[13px]">{likeCount}</span>
              )}
            </button>

            {/* Bookmark */}
            <button
              className={cn(
                'flex items-center justify-center p-1.5 rounded-full transition-colors',
                isBookmarked
                  ? 'text-[#0085ff]'
                  : 'text-muted-foreground hover:bg-muted'
              )}
              onClick={handleBookmark}
              aria-label="Bookmark"
            >
              <Bookmark className={cn('h-5 w-5', isBookmarked && 'fill-current')} />
            </button>

            {/* Share */}
            <button
              className="flex items-center justify-center p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              onClick={handleShare}
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center justify-center p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCardClick(); }}>
                  View post
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  Mute @{post.author.handle}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={(e) => e.stopPropagation()}
                >
                  Report post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </article>
  );
}

export function PostSkeleton() {
  return (
    <article className="border-b border-border py-3 px-4 bg-background">
      <div className="flex gap-3 animate-pulse">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-4 w-20 bg-muted rounded" />
          </div>
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
          <div className="flex justify-between mt-3">
            <div className="h-6 w-6 bg-muted rounded-full" />
            <div className="h-6 w-6 bg-muted rounded-full" />
            <div className="h-6 w-6 bg-muted rounded-full" />
            <div className="h-6 w-6 bg-muted rounded-full" />
            <div className="h-6 w-6 bg-muted rounded-full" />
            <div className="h-6 w-6 bg-muted rounded-full" />
          </div>
        </div>
      </div>
    </article>
  );
}
