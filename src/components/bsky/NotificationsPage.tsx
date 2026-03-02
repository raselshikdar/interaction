'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Settings, UserPlus, Heart, Repeat2, MessageCircle, AtSign, Quote, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Notification, User } from '@/types';
import { useAuthStore, useAppStore, useNotificationStore } from '@/store';
import { AppLayout, UserAvatar, FollowButton, NotificationTabs } from '@/components/bsky';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Notification type icon mapping
const notificationIcons = {
  follow: UserPlus,
  like: Heart,
  repost: Repeat2,
  reply: MessageCircle,
  mention: AtSign,
  quote: Quote
};

// Notification type color mapping
const notificationColors = {
  follow: 'text-primary',
  like: 'text-red-500',
  repost: 'text-green-500',
  reply: 'text-primary',
  mention: 'text-primary',
  quote: 'text-primary'
};

// Notification type label mapping
const notificationLabels = {
  follow: 'followed you',
  like: 'liked your post',
  repost: 'reposted your post',
  reply: 'replied to your post',
  mention: 'mentioned you',
  quote: 'quoted your post'
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const Icon = notificationIcons[notification.type] || UserPlus;
  const iconColor = notificationColors[notification.type] || 'text-primary';
  const label = notificationLabels[notification.type] || 'interacted with you';
  
  const actor = notification.actor;
  const post = notification.post;
  
  const formattedTime = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  
  // Mark as read when clicked
  const handleClick = useCallback(() => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  }, [notification.read, notification.id, onMarkAsRead]);

  // Follow notification
  if (notification.type === 'follow' && actor) {
    return (
      <article 
        className={cn(
          'border-b border-border p-4 hover:bg-muted/30 transition-colors cursor-pointer',
          !notification.read && 'bg-primary/5'
        )}
        onClick={handleClick}
      >
        <div className="flex gap-3">
          {/* Icon indicator */}
          <div className="flex flex-col items-center">
            <div className={cn('mt-1', iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <UserAvatar 
                  user={actor as User} 
                  size="sm" 
                  linkToProfile 
                />
              </div>
              <FollowButton targetUser={actor as User} size="sm" />
            </div>
            
            <p className="text-sm text-muted-foreground mt-1">
              <Link 
                href={`/profile/${actor.handle}`}
                className="font-medium text-foreground hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {actor.displayName || actor.handle}
              </Link>
              {' '}{label}
            </p>
            
            <p className="text-xs text-muted-foreground mt-1">{formattedTime}</p>
          </div>
        </div>
      </article>
    );
  }

  // Like, repost, reply, mention, quote notifications with post preview
  if (actor && post) {
    return (
      <article 
        className={cn(
          'border-b border-border p-4 hover:bg-muted/30 transition-colors cursor-pointer',
          !notification.read && 'bg-primary/5'
        )}
        onClick={handleClick}
      >
        <div className="flex gap-3">
          {/* Icon indicator */}
          <div className="flex flex-col items-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src={actor.avatar || undefined} alt={actor.displayName || actor.handle} />
              <AvatarFallback>{(actor.displayName || actor.handle)[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className={cn('mt-1', iconColor)}>
              <Icon className={cn('h-4 w-4', notification.type === 'like' && 'fill-current')} />
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <Link 
                href={`/profile/${actor.handle}`}
                className="font-semibold text-foreground hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {actor.displayName || actor.handle}
              </Link>
              {' '}{label}
            </p>
            
            <p className="text-xs text-muted-foreground mt-0.5">{formattedTime}</p>
            
            {/* Post preview */}
            <Card className="mt-2 p-3 bg-muted/30 border-border">
              <Link 
                href={`/post/${post.id}`}
                onClick={(e) => e.stopPropagation()}
                className="block"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={post.author.avatar || undefined} />
                    <AvatarFallback className="text-[8px]">
                      {(post.author.displayName || post.author.handle)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {post.author.displayName || post.author.handle}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {post.content}
                </p>
              </Link>
            </Card>
          </div>
        </div>
      </article>
    );
  }

  // Fallback for notifications without actor or post
  return (
    <article 
      className={cn(
        'border-b border-border p-4 hover:bg-muted/30 transition-colors cursor-pointer',
        !notification.read && 'bg-primary/5'
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <div className={cn('mt-1', iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)} notification
          </p>
          <p className="text-xs text-muted-foreground mt-1">{formattedTime}</p>
        </div>
      </div>
    </article>
  );
}

function NotificationSkeleton() {
  return (
    <article className="border-b border-border p-4">
      <div className="flex gap-3 animate-pulse">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="h-4 w-4 bg-muted" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 bg-muted rounded" />
          <div className="h-3 w-1/4 bg-muted rounded" />
          <div className="h-16 w-full bg-muted rounded mt-2" />
        </div>
      </div>
    </article>
  );
}

function EmptyNotifications() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <AtSign className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-1">No notifications yet</h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        When someone likes, reposts, or replies to your posts, you'll see it here.
      </p>
    </div>
  );
}

export function NotificationsPage() {
  const { user, token, isAuthenticated } = useAuthStore();
  const { currentNotificationTab } = useAppStore();
  const { notifications, setNotifications, markAsRead, markAllAsRead, unreadCount } = useNotificationStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const type = currentNotificationTab === 'mentions' ? 'mentions' : 'all';
      const response = await fetch(`/api/notifications?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, currentNotificationTab, setNotifications]);

  // Initial fetch and tab change
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle mark as read for single notification
  const handleMarkAsRead = useCallback(async (id: string) => {
    if (!token) return;
    
    markAsRead(id);
    
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [token, markAsRead]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    if (!token || unreadCount === 0) return;
    
    setIsMarkingAllRead(true);
    
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ all: true })
      });
      
      markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setIsMarkingAllRead(false);
    }
  }, [token, unreadCount, markAllAsRead]);

  // Filter notifications based on current tab
  const filteredNotifications = currentNotificationTab === 'mentions'
    ? notifications.filter(n => n.type === 'mention')
    : notifications;

  // Header right action - settings and mark all read
  const headerRightAction = (
    <div className="flex items-center gap-2">
      {unreadCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAllAsRead}
          disabled={isMarkingAllRead}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {isMarkingAllRead ? 'Marking...' : 'Mark all read'}
        </Button>
      )}
      <Button variant="ghost" size="icon" className="shrink-0" asChild>
        <Link href="/settings">
          <Settings className="h-5 w-5" />
        </Link>
      </Button>
    </div>
  );

  return (
    <>
      {/* Header with Back Button */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 -ml-2 rounded-full hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="text-[17px] font-semibold text-foreground">Notifications</h1>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllRead}
                className="text-sm text-gray-500 hover:text-black"
              >
                {isMarkingAllRead ? 'Marking...' : 'Mark all read'}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="shrink-0 rounded-full hover:bg-gray-100" asChild>
              <Link href="/settings">
                <Settings className="h-5 w-5 text-black" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Notification tabs */}
      <NotificationTabs />
      
      {/* Unread badge */}
      {unreadCount > 0 && (
          <div className="px-4 py-2 bg-muted border-b border-border">
          <Badge variant="secondary" className="text-xs rounded-full">
            {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
          </Badge>
        </div>
      )}
      
      {/* Notifications list */}
      <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
        {isLoading ? (
          // Loading skeletons
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </>
        ) : filteredNotifications.length === 0 ? (
          // Empty state
          <EmptyNotifications />
        ) : (
          // Notification items
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          ))
        )}
      </div>
    </>
  );
}
