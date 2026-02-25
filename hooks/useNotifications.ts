'use client';

import { useEffect, useMemo } from 'react';
import { useBudgets, useExpenses } from '@/hooks/useData';
import { useNotificationStore } from '@/store/notificationStore';

const BUDGET_ALERT_THRESHOLDS = [80, 100] as const;

export function useNotifications() {
  const { budgets, isLoading: budgetsLoading } = useBudgets();
  const { expenses, isLoading: expensesLoading } = useExpenses();
  const { notifications, addNotification, getUnreadCount, hasHydrated } = useNotificationStore();

  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthTotal = useMemo(() => {
    return expenses
      .filter((expense) => {
        const rawDate = typeof expense.date === 'string' ? expense.date : expense.date.toISOString();
        return rawDate.startsWith(currentMonth);
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses, currentMonth]);

  const currentBudget = useMemo(
    () => budgets.find((budget) => budget.month === currentMonth),
    [budgets, currentMonth]
  );

  useEffect(() => {
    if (!hasHydrated || !currentBudget || currentBudget.total_amount <= 0) return;

    const usagePercent = (monthTotal / currentBudget.total_amount) * 100;

    BUDGET_ALERT_THRESHOLDS.forEach((threshold) => {
      if (usagePercent < threshold) return;

      addNotification({
        type: 'budget_alert',
        title: threshold === 100 ? 'Budget exceeded' : `Budget ${threshold}% used`,
        message:
          threshold === 100
            ? `You have exceeded your ${currentMonth} budget.`
            : `You have used ${Math.floor(usagePercent)}% of your ${currentMonth} budget.`,
        eventKey: `budget-alert:${currentMonth}:${threshold}`,
        route: '/budgets',
      });
    });
  }, [addNotification, currentBudget, currentMonth, hasHydrated, monthTotal]);

  return {
    notifications,
    unreadCount: getUnreadCount(),
    isLoading: budgetsLoading || expensesLoading || !hasHydrated,
  };
}
