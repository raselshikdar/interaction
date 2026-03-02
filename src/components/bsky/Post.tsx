'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
function renderContent(content: string, onHashtagClick?: (tag: string) => void, onMentionClick?: (handle: string) => void) {
  if (!content) return null;
  
  const parts: React.ReactNode[] = [];
  const regex = /(#\w+|@\w+|https?:\/\/[^\s]+)/g;
  let lastIndex = 0;
  let key = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{content.slice(lastIndex, match.index)}</span>);
    }

    const entity = match[0];
    
    if (entity.startsWith('#')) {
      // Hashtag - clickable
      const tag = entity.slice(1);
      parts.push(
        <a 
          key={key++} 
          href={`#search/${encodeURIComponent(tag)}`}
          onClick={(e) => {
            e.preventDefault();
            onHashtagClick?.(tag);
            window.location.hash = `search/${encodeURIComponent(tag)}`;
          }}
          className="text-[#0085ff] hover:underline"
        >
          {entity}
        </a>
      );
    } else if (entity.startsWith('@')) {
      // Mention - clickable
      const handle = entity.slice(1);
      parts.push(
        <a 
          key={key++} 
          href={`#profile/${handle}`}
          onClick={(e) => {
            e.preventDefault();
            onMentionClick?.(handle);
            window.location.hash = `profile/${handle}`;
          }}
          className="text-[#0085ff] hover:underline"
        >
          {entity}
        </a>
      );
    } else {
      // URL - clickable
      parts.push(
        <a 
          key={key++} 
          href={entity} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#0085ff] hover:underline"
        >
          {entity.length > 30 ? entity.slice(0, 30) + '...' : entity}
        </a>
      );
    }

    lastIndex = match.index + entity.length;
  }

  // Add remaining text
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
  compact?: boolean;
}

export function Post({ post, onLike, onRepost, onBookmark, onReply, onQuote, compact = false }: PostProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [isReposted, setIsReposted] = useState(post.isReposted);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [repostCount, setRepostCount] = useState(post.repostCount);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.();
  };

  const handleRepost = () => {
    setIsReposted(!isReposted);
    setRepostCount(prev => isReposted ? prev - 1 : prev + 1);
    onRepost?.();
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.();
  };

  const formattedTime = formatShortTime(new Date(post.createdAt));
  const authorName = post.author.displayName || post.author.handle;
  const images = post.images ? (typeof post.images === 'string' ? JSON.parse(post.images) : post.images) : null;

  return (
    <article className={cn(
      'border-b border-gray-200 bg-white',
      compact ? 'p-3' : 'py-3 px-4'
    )}>
      <div className="flex gap-3">
        {/* Avatar - 40px EXACT bsky size */}
        <Link href={`#profile/${post.author.handle}`} className="shrink-0">
          <Avatar className="h-10 w-10 rounded-full">
            <AvatarImage src={post.author.avatar || undefined} alt={authorName} />
            <AvatarFallback>{authorName[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          {/* Header Row - EXACT bsky layout */}
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            <Link 
              href={`#profile/${post.author.handle}`}
              className="font-semibold text-black text-[15px] hover:underline truncate"
            >
              {authorName}
            </Link>
            {post.author.verified && (
              <svg className="h-4 w-4 text-[#0085ff] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            )}
            <Link 
              href={`#profile/${post.author.handle}`}
              className="text-gray-500 text-[15px] truncate"
            >
              @{post.author.handle}
            </Link>
            <span className="text-gray-500 text-[15px]">·</span>
            <span className="text-gray-500 text-[15px] whitespace-nowrap">
              {formattedTime}
            </span>
          </div>

          {/* Content - EXACT bsky style with highlighted entities */}
          <div className="mt-0.5">
            <p className="text-[15px] text-black whitespace-pre-wrap break-words leading-[1.35]">
              {renderContent(post.content)}
            </p>
          </div>

          {/* Images */}
          {images && images.length > 0 && (
            <div className={cn(
              'mt-2.5 grid gap-0.5 rounded-xl overflow-hidden border border-gray-200',
              images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            )}>
              {images.map((img: string, idx: number) => (
                <div key={idx} className="aspect-square relative bg-gray-100">
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
              className="mt-2.5 flex border border-gray-200 rounded-xl overflow-hidden hover:bg-gray-50 transition-colors"
            >
              {post.linkCard.image && (
                <div className="w-24 h-24 shrink-0 bg-gray-100">
                  <img 
                    src={post.linkCard.image} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-black truncate">{post.linkCard.title}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {post.linkCard.description}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Globe className="h-3 w-3" />
                  {new URL(post.linkCard.url).hostname}
                </p>
              </div>
            </a>
          )}

          {/* Quote Post */}
          {post.quotePost && (
            <div className="mt-2.5 border border-gray-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5 rounded-full">
                  <AvatarImage src={post.quotePost.author.avatar || undefined} />
                  <AvatarFallback className="text-xs">{post.quotePost.author.handle[0]}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm text-black">{post.quotePost.author.displayName || post.quotePost.author.handle}</span>
                <span className="text-gray-500 text-sm">@{post.quotePost.author.handle}</span>
              </div>
              <p className="text-sm text-black mt-1 line-clamp-3">{post.quotePost.content}</p>
            </div>
          )}

          {/* Actions - EXACT bsky style: 20px icons, proper spacing */}
          <div className="flex items-center justify-between mt-2 -ml-1.5 mr-1.5">
            {/* Comment */}
            <button 
              className="flex items-center justify-center gap-1 p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500 group"
              onClick={onReply}
            >
              <MessageCircle className="h-5 w-5 group-hover:text-[#0085ff]" />
              {post.replyCount > 0 && (
                <span className="text-[13px] text-gray-500 group-hover:text-[#0085ff]">{post.replyCount}</span>
              )}
            </button>

            {/* Repost */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className={cn(
                    'flex items-center justify-center gap-1 p-1.5 rounded-full transition-colors',
                    isReposted ? 'text-green-500' : 'text-gray-500 hover:bg-gray-100'
                  )}
                >
                  <Repeat2 className="h-5 w-5" />
                  {repostCount > 0 && (
                    <span className="text-[13px]">{repostCount}</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-40">
                <DropdownMenuItem onClick={handleRepost}>
                  <Repeat2 className="h-4 w-4 mr-2" />
                  Repost
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onQuote}>
                  <Quote className="h-4 w-4 mr-2" />
                  Quote
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Like */}
            <button 
              className={cn(
                'flex items-center justify-center gap-1 p-1.5 rounded-full transition-colors',
                isLiked ? 'text-red-500' : 'text-gray-500 hover:bg-gray-100'
              )}
              onClick={handleLike}
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
                isBookmarked ? 'text-[#0085ff]' : 'text-gray-500 hover:bg-gray-100'
              )}
              onClick={handleBookmark}
            >
              <Bookmark className={cn('h-5 w-5', isBookmarked && 'fill-current')} />
            </button>

            {/* Share */}
            <button className="flex items-center justify-center p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
              <Share2 className="h-5 w-5" />
            </button>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>View post</DropdownMenuItem>
                <DropdownMenuItem>Copy link</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Mute @{post.author.handle}</DropdownMenuItem>
                <DropdownMenuItem className="text-red-500">Report post</DropdownMenuItem>
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
    <article className="border-b border-gray-200 py-3 px-4 bg-white">
      <div className="flex gap-3 animate-pulse">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="flex justify-between mt-3">
            <div className="h-6 w-6 bg-gray-200 rounded-full" />
            <div className="h-6 w-6 bg-gray-200 rounded-full" />
            <div className="h-6 w-6 bg-gray-200 rounded-full" />
            <div className="h-6 w-6 bg-gray-200 rounded-full" />
            <div className="h-6 w-6 bg-gray-200 rounded-full" />
            <div className="h-6 w-6 bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>
    </article>
  );
}
