'use client';

import React, { useCallback } from 'react';
import { useAuthStore } from '@/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft,
  UserPlus,
  User,
  Lock,
  Hand,
  Bell,
  FileVideo,
  Palette,
  Accessibility,
  Globe,
  HelpCircle,
  Info,
  ChevronRight
} from 'lucide-react';

interface SettingsPageProps {
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  isDestructive?: boolean;
}

function SettingsItem({ icon, label, onClick, isDestructive }: SettingsItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-muted transition-colors"
    >
      <div className={cn(
        "flex items-center justify-center w-6 h-6",
        isDestructive ? "text-red-500" : "text-foreground"
      )}>
        {icon}
      </div>
      <span className={cn(
        "flex-1 text-left text-[15px]",
        isDestructive ? "text-red-500" : "text-foreground"
      )}>
        {label}
      </span>
      {!isDestructive && (
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      )}
    </button>
  );
}

export function SettingsPage({ onBack, onNavigate }: SettingsPageProps) {
  const { user, logout } = useAuthStore();
  
  const navigateTo = useCallback((view: string) => {
    if (onNavigate) {
      onNavigate(view);
    } else {
      window.history.pushState(null, '', `/${view}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [onNavigate]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  }, [onBack]);

  const handleSignOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [logout]);

  const settingsItems = [
    { 
      icon: <UserPlus className="h-5 w-5" />, 
      label: 'Add another account',
      view: 'settings-add-account'
    },
    { 
      icon: <User className="h-5 w-5" />, 
      label: 'Account',
      view: 'settings-account'
    },
    { 
      icon: <Lock className="h-5 w-5" />, 
      label: 'Privacy and security',
      view: 'settings-privacy'
    },
    { 
      icon: <Hand className="h-5 w-5" />, 
      label: 'Moderation',
      view: 'settings-moderation'
    },
    { 
      icon: <Bell className="h-5 w-5" />, 
      label: 'Notifications',
      view: 'settings-notifications'
    },
    { 
      icon: <FileVideo className="h-5 w-5" />, 
      label: 'Content and media',
      view: 'settings-content'
    },
    { 
      icon: <Palette className="h-5 w-5" />, 
      label: 'Appearance',
      view: 'settings-appearance'
    },
    { 
      icon: <Accessibility className="h-5 w-5" />, 
      label: 'Accessibility',
      view: 'settings-accessibility'
    },
    { 
      icon: <Globe className="h-5 w-5" />, 
      label: 'Languages',
      view: 'settings-language'
    },
    { 
      icon: <HelpCircle className="h-5 w-5" />, 
      label: 'Help',
      view: 'settings-help'
    },
    { 
      icon: <Info className="h-5 w-5" />, 
      label: 'About',
      view: 'settings-about'
    },
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-[17px] font-semibold text-foreground">Settings</h1>
        </div>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <Avatar className="h-12 w-12 rounded-full">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback>{(user.displayName || user.handle)[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-semibold text-foreground truncate">{user.displayName}</h2>
            <p className="text-[15px] text-muted-foreground truncate">@{user.handle}</p>
          </div>
        </div>
      )}

      {/* Settings Menu Items */}
      <div className="divide-y divide-border">
        {settingsItems.map((item, index) => (
          <SettingsItem 
            key={index} 
            icon={item.icon} 
            label={item.label}
            onClick={() => navigateTo(item.view)}
          />
        ))}
      </div>

      {/* Sign Out */}
      <div className="mt-2 border-t border-border">
        <SettingsItem 
          icon={<ArrowLeft className="h-5 w-5 rotate-180" />} 
          label="Sign out" 
          onClick={handleSignOut}
          isDestructive
        />
      </div>
    </div>
  );
}

export default SettingsPage;
