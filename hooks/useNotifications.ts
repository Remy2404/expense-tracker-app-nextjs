'use client';

import { useEffect } from 'react';
import { useDashboardSummary } from '@/hooks/useData';
import { useNotificationStore } from '@/store/notificationStore';

const BUDGET_ALERT_THRESHOLDS = [80, 100] as const;

export function useNotifications() {
  const { summary, isLoading: summaryLoading } = useDashboardSummary();
  const { notifications, addNotification, getUnreadCount, hasHydrated } = useNotificationStore();

  useEffect(() => {
    if (!hasHydrated) return;

    const budget = summary?.budgetSummary;
    if (!budget || budget.budgetLimit <= 0) return;

    const usagePercent = (budget.spent / budget.budgetLimit) * 100;
    const month = budget.month;

    for (const threshold of BUDGET_ALERT_THRESHOLDS) {
      if (usagePercent < threshold) {
        continue;
      }

      addNotification({
        type: 'budget_alert',
        title: threshold === 100 ? 'Budget exceeded' : `Budget ${threshold}% used`,
        message:
          threshold === 100
            ? `You have exceeded your ${month} budget.`
            : `You have used ${Math.floor(usagePercent)}% of your ${month} budget.`,
        eventKey: `budget-alert:${month}:${threshold}`,
        route: '/budgets',
      });
    }
  }, [addNotification, hasHydrated, summary?.budgetSummary]);

  return {
    notifications,
    unreadCount: getUnreadCount(),
    isLoading: summaryLoading || !hasHydrated,
  };
}
