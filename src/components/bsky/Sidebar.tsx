'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore, useAppStore } from '@/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  Search,
  Home,
  MessageCircle,
  Bell,
  User,
  Settings,
  Bookmark,
  List,
  Hash,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

// Exact bsky navigation items order
const navItems = [
  { id: 'explore', icon: Search, label: 'Explore' },
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'chat', icon: MessageCircle, label: 'Chat' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'feeds', icon: Hash, label: 'Feeds' },
  { id: 'lists', icon: List, label: 'Lists' },
  { id: 'saved', icon: Bookmark, label: 'Saved' },
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

interface SidebarContentProps {
  onNavigate?: (view: string, handle?: string) => void;
  onClose?: () => void;
}

function SidebarContent({ onNavigate, onClose }: SidebarContentProps) {
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleNavClick = (id: string) => {
    if (id === 'profile') {
      onNavigate?.(id, user.handle);
    } else {
      onNavigate?.(id);
    }
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* User Profile Section */}
      <div className="p-4 pb-3">
        <button 
          onClick={() => handleNavClick('profile')}
          className="flex items-center gap-3 w-full text-left"
        >
          <Avatar className="h-12 w-12 rounded-full">
            <AvatarImage src={user.avatar || undefined} alt={user.displayName || user.handle} />
            <AvatarFallback className="text-lg">{(user.displayName || user.handle)[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        </button>

        <div className="mt-2">
          <button 
            onClick={() => handleNavClick('profile')}
            className="font-bold text-[18px] text-foreground leading-tight hover:underline"
          >
            {user.displayName || user.handle}
          </button>
          <p className="text-[14px] text-muted-foreground mt-0.5">@{user.handle}</p>
        </div>

        <div className="flex items-center gap-1 mt-2 text-[14px] text-muted-foreground">
          <button className="hover:underline">
            <span className="font-semibold text-foreground">{user.followersCount}</span>
            <span className="ml-1">followers</span>
          </button>
          <span className="mx-1">·</span>
          <button className="hover:underline">
            <span className="font-semibold text-foreground">{user.followingCount}</span>
            <span className="ml-1">following</span>
          </button>
        </div>
      </div>

      <Separator className="mb-2" />

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={cn(
              'flex items-center gap-5 w-full px-4 py-3 text-left rounded-lg transition-colors',
              'hover:bg-accent'
            )}
          >
            <item.icon className="h-6 w-6 text-foreground shrink-0" />
            <span className="text-[16px] text-foreground">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 pt-2">
        <div className="flex flex-col gap-2 text-[14px] text-muted-foreground mb-3">
          <a href="#" className="text-primary hover:underline">Terms of Service</a>
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full px-4 h-8 text-[14px]"
          >
            <MessageSquare className="h-4 w-4 mr-1.5" />
            Feedback
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full px-4 h-8 text-[14px]"
          >
            <HelpCircle className="h-4 w-4 mr-1.5" />
            Help
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return null; // We use Sheet for mobile
}

export function SidebarTrigger({ children }: { children: React.ReactNode }) {
  return (
    <Sheet>
      {children}
    </Sheet>
  );
}

export function MobileSidebar({ 
  open, 
  onOpenChange, 
  onNavigate 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: string, handle?: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0 border-r border-border bg-background">
        <SidebarContent onNavigate={onNavigate} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
