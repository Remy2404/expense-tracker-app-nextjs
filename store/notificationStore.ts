import { Notification } from '@/types/notification';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

interface NotificationState {
  notifications: Notification[];
  hasHydrated: boolean;
  eventKeys: Record<string, true>;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'date'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
  setHasHydrated: (value: boolean) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      eventKeys: {},
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      addNotification: (notification) => {
        if (notification.eventKey && get().eventKeys[notification.eventKey]) {
          return;
        }

        const nextNotification: Notification = {
          ...notification,
          id: uuidv4(),
          isRead: false,
          date: new Date().toISOString(),
        };

        set((state) => ({
          notifications: [nextNotification, ...state.notifications],
          eventKeys: notification.eventKey
            ? { ...state.eventKeys, [notification.eventKey]: true }
            : state.eventKeys,
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        }));
      },

      deleteNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearAll: () => set({ notifications: [], eventKeys: {} }),

      getUnreadCount: () => get().notifications.filter((n) => !n.isRead).length,
    }),
    {
      name: 'notification-storage-web',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
