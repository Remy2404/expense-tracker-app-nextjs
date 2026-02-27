'use client';

import { useMemo, useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/state/EmptyState';
import { PageSkeleton } from '@/components/state/PageSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const unreadCount = getUnreadCount();

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter((notification) => !notification.isRead);
    return notifications.filter((notification) => notification.type === filter);
  }, [filter, notifications]);

  if (!hasHydrated) {
    return <PageSkeleton cards={1} rows={5} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-foreground/60">Stay updated on budgets and account events.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <CheckCheck size={16} />
            Mark all read
          </Button>
          <Button
            onClick={clearAll}
            disabled={notifications.length === 0}
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 size={16} />
            Clear all
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.value}
            onClick={() => setFilter(item.value)}
            variant={filter === item.value ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            aria-pressed={filter === item.value}
          >
            {item.label}
          </Button>
        ))}
        <Badge variant="outline" className="ml-auto">
          {unreadCount} unread
        </Badge>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Inbox
          </CardTitle>
          <CardDescription>
            {filtered.length} shown • {notifications.length} total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              title="No notifications"
              description="You're all caught up."
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`p-4 md:p-5 flex items-start justify-between gap-4 transition-colors ${
                  item.isRead ? '' : 'bg-primary/5 border-l-2 border-primary'
                }`}
              >
                <button
                  className="text-left flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => markAsRead(item.id)}
                  aria-label={`Mark "${item.title}" as read`}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{item.title}</p>
                    {!item.isRead ? <Badge className="h-5 px-2">New</Badge> : null}
                  </div>
                  <p className="text-sm text-foreground/70 mt-1">{item.message}</p>
                  <p className="text-xs text-foreground/50 mt-2">{new Date(item.date).toLocaleString()}</p>
                </button>
                <Button
                  onClick={() => deleteNotification(item.id)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
