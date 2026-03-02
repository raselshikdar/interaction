'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store';

export interface UserSettings {
  // Privacy Settings
  isPrivate: boolean;
  showFollowers: boolean;
  showFollowing: boolean;
  allowTagging: boolean;
  allowMentions: boolean;
  showOnlineStatus: boolean;
  
  // Security Settings
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  
  // Notification Settings
  pushNotifications: boolean;
  emailNotifications: boolean;
  notifyFollows: boolean;
  notifyLikes: boolean;
  notifyReposts: boolean;
  notifyReplies: boolean;
  notifyMentions: boolean;
  notifyQuotes: boolean;
  
  // Content Settings
  autoplayVideos: boolean;
  showSensitiveContent: boolean;
  mediaQuality: string;
  reduceMotion: boolean;
  
  // Appearance Settings
  theme: string;
  fontSize: string;
  compactMode: boolean;
  
  // Accessibility Settings
  screenReader: boolean;
  highContrast: boolean;
  reduceAnimations: boolean;
  
  // Language Settings
  language: string;
}

interface UserSettingsContextType {
  settings: UserSettings | null;
  isLoading: boolean;
  updateSetting: (key: keyof UserSettings, value: boolean | string) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  isPrivate: false,
  showFollowers: true,
  showFollowing: true,
  allowTagging: true,
  allowMentions: true,
  showOnlineStatus: true,
  twoFactorEnabled: false,
  loginAlerts: true,
  pushNotifications: true,
  emailNotifications: true,
  notifyFollows: true,
  notifyLikes: true,
  notifyReposts: true,
  notifyReplies: true,
  notifyMentions: true,
  notifyQuotes: true,
  autoplayVideos: true,
  showSensitiveContent: false,
  mediaQuality: 'auto',
  reduceMotion: false,
  theme: 'system',
  fontSize: 'medium',
  compactMode: false,
  screenReader: false,
  highContrast: false,
  reduceAnimations: false,
  language: 'en',
};

const UserSettingsContext = createContext<UserSettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  updateSetting: async () => {},
  refreshSettings: async () => {},
});

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Apply settings to the document
  const applySettings = useCallback((newSettings: UserSettings) => {
    // Apply theme
    setTheme(newSettings.theme);
    
    // Apply font size
    const root = document.documentElement;
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    root.classList.add(`font-size-${newSettings.fontSize}`);
    
    // Apply compact mode
    if (newSettings.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
    
    // Apply high contrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply reduced animations
    if (newSettings.reduceAnimations || newSettings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Apply language
    root.lang = newSettings.language;
  }, [setTheme]);

  // Fetch settings from API
  const refreshSettings = useCallback(async () => {
    if (!token) {
      setSettings(defaultSettings);
      applySettings(defaultSettings);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const fetchedSettings = { ...defaultSettings, ...data.settings };
        setSettings(fetchedSettings);
        applySettings(fetchedSettings);
      } else {
        setSettings(defaultSettings);
        applySettings(defaultSettings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setSettings(defaultSettings);
      applySettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, [token, applySettings]);

  // Update a single setting
  const updateSetting = useCallback(async (key: keyof UserSettings, value: boolean | string) => {
    if (!token) return;

    // Optimistic update
    const newSettings = { ...(settings || defaultSettings), [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);

    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [key]: value })
      });
    } catch (error) {
      console.error('Failed to update setting:', error);
      // Revert on error
      refreshSettings();
    }
  }, [token, settings, applySettings, refreshSettings]);

  // Initial load
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <UserSettingsContext.Provider value={{ settings, isLoading, updateSetting, refreshSettings }}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}
