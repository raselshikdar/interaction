'use client';

import React, { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore, useNotificationStore, useAppStore } from '@/store';
import { useUnreadStore } from '@/store/unread';
import { Home, Search, MessageCircle, Bell, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ViewType = 'home' | 'explore' | 'notifications' | 'messages' | 'profile' | 'settings' | 'saved' | 'feeds' | 'lists';

const navItems: { id: ViewType; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'explore', icon: Search, label: 'Explore' },
  { id: 'messages', icon: MessageCircle, label: 'Messages' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'profile', icon: User, label: 'Profile' },
];

interface BottomNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType, handle?: string) => void;
  userHandle?: string;
}

export function BottomNav({ currentView, onNavigate, userHandle }: BottomNavProps) {
  const { isAuthenticated, token } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { messageCount, setMessageCount } = useUnreadStore();

  // Fetch unread counts
  const fetchUnreadCounts = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/unread-counts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessageCount(data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  }, [token, setMessageCount]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCounts();
      // Poll every 30 seconds for unread counts
      const interval = setInterval(fetchUnreadCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCounts]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const showNotificationBadge = item.id === 'notifications' && unreadCount > 0;
          const showMessageBadge = item.id === 'messages' && messageCount > 0;
          const badgeCount = showNotificationBadge ? unreadCount : (showMessageBadge ? messageCount : 0);
          const showBadge = showNotificationBadge || showMessageBadge;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id, item.id === 'profile' ? userHandle : undefined)}
              className={cn(
                'flex flex-col items-center justify-center w-14 h-14 relative',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <item.icon className="h-6 w-6" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#0085ff] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function FloatingPostButton() {
  const { isAuthenticated } = useAuthStore();
  const { setComposerOpen } = useAppStore();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button
      onClick={() => setComposerOpen(true)}
      className="fixed bottom-20 right-4 rounded-full h-14 w-14 shadow-lg z-40 md:hidden bg-[#0085ff] hover:bg-[#0070e0]"
      size="icon"
    >
      <Plus className="h-6 w-6 text-white" />
    </Button>
  );
}
