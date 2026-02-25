'use client';

import { useMemo, useState } from 'react';
import { BellOff, CheckCheck, Trash2 } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { NotificationType } from '@/types/notification';

type FilterType = 'all' | 'unread' | NotificationType;

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Budget', value: 'budget_alert' },
  { label: 'System', value: 'system' },
];

export default function NotificationsPage() {
  const {
    notifications,
    hasHydrated,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    getUnreadCount,
  } = useNotificationStore();

  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter((notification) => !notification.isRead);
    return notifications.filter((notification) => notification.type === filter);
  }, [filter, notifications]);

  if (!hasHydrated) {
    return (
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-foreground/60">Stay updated on budgets and account events.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            disabled={getUnreadCount() === 0}
            className="inline-flex items-center gap-2 border border-border px-3 py-2 rounded-lg hover:bg-foreground/5 transition-colors disabled:opacity-50"
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
          <button
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="inline-flex items-center gap-2 border border-border px-3 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <Trash2 size={16} />
            Clear all
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              filter === item.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-foreground/5'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40">
              <BellOff size={32} />
            </div>
            <h3 className="text-lg font-semibold">No notifications</h3>
            <p className="text-foreground/60 mt-2">You&apos;re all caught up.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`p-4 md:p-5 flex items-start justify-between gap-4 ${
                  item.isRead ? '' : 'bg-primary/5'
                }`}
              >
                <button className="text-left flex-1" onClick={() => markAsRead(item.id)}>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-foreground/70 mt-1">{item.message}</p>
                  <p className="text-xs text-foreground/50 mt-2">{new Date(item.date).toLocaleString()}</p>
                </button>
                <button
                  onClick={() => deleteNotification(item.id)}
                  className="p-2 rounded-full hover:bg-red-500/10 hover:text-red-600 transition-colors"
                  aria-label="Delete notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
