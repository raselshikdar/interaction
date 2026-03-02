'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showHandle?: boolean;
  showFollowButton?: boolean;
  linkToProfile?: boolean;
  className?: string;
}

export function UserAvatar({
  user,
  size = 'md',
  showName = false,
  showHandle = false,
  showFollowButton = false,
  linkToProfile = true,
  className
}: UserAvatarProps) {
  // EXACT bsky sizes
  const sizeClasses = {
    sm: 'h-8 w-8',   // 32px
    md: 'h-10 w-10', // 40px - most common
    lg: 'h-12 w-12', // 48px - sidebar
    xl: 'h-20 w-20'  // 80px
  };

  const avatar = (
    <Avatar className={cn(sizeClasses[size], 'rounded-full', className)}>
      <AvatarImage src={user.avatar || undefined} alt={user.displayName || user.handle} />
      <AvatarFallback>{(user.displayName || user.handle)[0].toUpperCase()}</AvatarFallback>
    </Avatar>
  );

  if (!showName && !showHandle && !showFollowButton) {
    if (linkToProfile) {
      return <Link href={`/profile/${user.handle}`}>{avatar}</Link>;
    }
    return avatar;
  }

  return (
    <div className="flex items-center gap-3">
      {linkToProfile ? (
        <Link href={`/profile/${user.handle}`}>{avatar}</Link>
      ) : (
        avatar
      )}
      <div className="flex-1 min-w-0">
        {linkToProfile ? (
          <Link href={`/profile/${user.handle}`}>
            <p className="font-semibold text-[15px] text-foreground truncate hover:underline">{user.displayName || user.handle}</p>
            {showHandle && (
              <p className="text-[14px] text-muted-foreground truncate">@{user.handle}</p>
            )}
          </Link>
        ) : (
          <>
            <p className="font-semibold text-[15px] text-black truncate">{user.displayName || user.handle}</p>
            {showHandle && (
              <p className="text-[14px] text-gray-500 truncate">@{user.handle}</p>
            )}
          </>
        )}
      </div>
      {showFollowButton && <FollowButton targetUser={user} />}
    </div>
  );
}

interface FollowButtonProps {
  targetUser: User;
  size?: 'sm' | 'md' | 'lg';
}

export function FollowButton({ targetUser, size = 'sm' }: FollowButtonProps) {
  const { user: currentUser } = useAuthStore();
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  if (!currentUser || currentUser.id === targetUser.id) {
    return null;
  }

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${targetUser.id}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST'
      });
      if (response.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // EXACT bsky button style
  return (
    <Button
      variant={isFollowing ? 'secondary' : 'default'}
      size={size === 'sm' ? 'sm' : 'default'}
      onClick={handleFollow}
      disabled={isLoading}
      className={cn(
        'rounded-full font-medium text-[14px]',
        isFollowing 
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' 
          : 'bg-[#0085ff] hover:bg-[#0070e0] text-white',
        size === 'sm' ? 'h-8 px-4' : 'h-9 px-5'
      )}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
