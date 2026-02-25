'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationsBell() {
  const { unreadCount } = useNotifications();

  return (
    <Link
      href="/notifications"
      className="relative hover:text-foreground transition-colors"
      aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-4 text-center font-semibold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
