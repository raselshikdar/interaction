import { create } from 'zustand';

interface UnreadState {
  notificationCount: number;
  messageCount: number;
  setNotificationCount: (count: number) => void;
  setMessageCount: (count: number) => void;
  incrementNotificationCount: () => void;
  incrementMessageCount: () => void;
  decrementNotificationCount: (by?: number) => void;
  decrementMessageCount: (by?: number) => void;
  resetNotificationCount: () => void;
  resetMessageCount: () => void;
}

export const useUnreadStore = create<UnreadState>((set) => ({
  notificationCount: 0,
  messageCount: 0,
  setNotificationCount: (count) => set({ notificationCount: count }),
  setMessageCount: (count) => set({ messageCount: count }),
  incrementNotificationCount: () => set((state) => ({ notificationCount: state.notificationCount + 1 })),
  incrementMessageCount: () => set((state) => ({ messageCount: state.messageCount + 1 })),
  decrementNotificationCount: (by = 1) => set((state) => ({ notificationCount: Math.max(0, state.notificationCount - by) })),
  decrementMessageCount: (by = 1) => set((state) => ({ messageCount: Math.max(0, state.messageCount - by) })),
  resetNotificationCount: () => set({ notificationCount: 0 }),
  resetMessageCount: () => set({ messageCount: 0 }),
}));
