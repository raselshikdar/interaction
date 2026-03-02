import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Post, Notification, Message, FeedType, ProfileTab, NotificationTab } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      }))
    }),
    {
      name: 'bsky-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated })
    }
  )
);

interface AppState {
  sidebarOpen: boolean;
  currentFeed: FeedType;
  currentProfileTab: ProfileTab;
  currentNotificationTab: NotificationTab;
  composerOpen: boolean;
  replyTo: Post | null;
  quotePost: Post | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentFeed: (feed: FeedType) => void;
  setCurrentProfileTab: (tab: ProfileTab) => void;
  setCurrentNotificationTab: (tab: NotificationTab) => void;
  setComposerOpen: (open: boolean) => void;
  setReplyTo: (post: Post | null) => void;
  setQuotePost: (post: Post | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  currentFeed: 'discover',
  currentProfileTab: 'posts',
  currentNotificationTab: 'all',
  composerOpen: false,
  replyTo: null,
  quotePost: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentFeed: (feed) => set({ currentFeed: feed }),
  setCurrentProfileTab: (tab) => set({ currentProfileTab: tab }),
  setCurrentNotificationTab: (tab) => set({ currentNotificationTab: tab }),
  setComposerOpen: (open) => set({ composerOpen: open }),
  setReplyTo: (post) => set({ replyTo: post }),
  setQuotePost: (post) => set({ quotePost: post })
}));

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ notifications, unreadCount: notifications.filter(n => !n.read).length }),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    unreadCount: Math.max(0, state.unreadCount - 1)
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0
  })),
  setUnreadCount: (count) => set({ unreadCount: count })
}));

interface MessageState {
  conversations: Map<string, Message[]>;
  activeConversation: string | null;
  setConversations: (conversations: Map<string, Message[]>) => void;
  addMessage: (userId: string, message: Message) => void;
  setActiveConversation: (userId: string | null) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  conversations: new Map(),
  activeConversation: null,
  setConversations: (conversations) => set({ conversations }),
  addMessage: (userId, message) => set((state) => {
    const conversations = new Map(state.conversations);
    const messages = conversations.get(userId) || [];
    conversations.set(userId, [...messages, message]);
    return { conversations };
  }),
  setActiveConversation: (userId) => set({ activeConversation: userId })
}));

// Re-export unread store
export { useUnreadStore } from './unread';
