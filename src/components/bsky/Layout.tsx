'use client';

import React, { useEffect } from 'react';
import { useAuthStore, useAppStore } from '@/store';
import { PostComposer } from './PostComposer';
import { cn } from '@/lib/utils';

type ViewType = 'home' | 'explore' | 'notifications' | 'messages' | 'profile' | 'settings' | 'saved' | 'feeds' | 'lists';

interface AppLayoutProps {
  children: React.ReactNode;
  currentView?: ViewType;
  onNavigate?: (view: ViewType, handle?: string) => void;
}

export function AppLayout({
  children,
  currentView = 'home',
  onNavigate
}: AppLayoutProps) {
  const { isAuthenticated, setUser, setToken, token, user } = useAuthStore();
  const { composerOpen } = useAppStore();

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setToken(data.token);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
        setToken(null);
      }
    };

    if (!isAuthenticated || !token) {
      checkAuth();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {children}
      {isAuthenticated && <PostComposer />}
    </div>
  );
}
