'use client';

import { useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { Budget } from '@/types';
import { BudgetModal } from '@/components/BudgetModal';
import { EmptyState } from '@/components/state/EmptyState';
import { useBudgets, useDeleteBudget, useExpenses } from '@/hooks/useData';
import { currencyFormat } from '@/lib/billSplit';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const normalizeMonthKey = (value: string) => {
  if (!value) return '';
  return value.slice(0, 7);
};

export default function BudgetsPage() {
  const { budgets, isLoading: isLoadingBudgets } = useBudgets();
  const { expenses, isLoading: isLoadingExpenses } = useExpenses();
  const { trigger: deleteBudget } = useDeleteBudget();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isLoading = isLoadingBudgets || isLoadingExpenses;

  const spendingByMonth = useMemo(() => {
    const spending: Record<string, number> = {};
    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthKey = format(date, 'yyyy-MM');
      spending[monthKey] = (spending[monthKey] || 0) + expense.amount;
    });
    return spending;
  }, [expenses]);

  const currentMonth = format(new Date(), 'yyyy-MM');

  const budgetsWithProgress = useMemo(() => {
    return budgets.map((budget) => {
      const budgetMonthKey = normalizeMonthKey(budget.month);
      const spent = spendingByMonth[budgetMonthKey] || 0;
      const remaining = budget.total_amount - spent;
      const percentageUsed = budget.total_amount > 0 ? (spent / budget.total_amount) * 100 : 0;
      const isOverBudget = remaining < 0;

      return {
        ...budget,
        spent,
        remaining,
        percentageUsed: Math.min(percentageUsed, 100),
        isOverBudget,
      };
    });
  }, [budgets, spendingByMonth]);

  const currentMonthBudget = useMemo(
    () => budgets.find((b) => normalizeMonthKey(b.month) === currentMonth),
    [budgets, currentMonth]
  );

  const latestBudget = useMemo(() => {
    if (budgets.length === 0) return null;
    return [...budgets]
      .sort((a, b) => normalizeMonthKey(b.month).localeCompare(normalizeMonthKey(a.month)))[0];
  }, [budgets]);

  const summaryBudget = currentMonthBudget ?? latestBudget;
  const isUsingFallbackBudget = !currentMonthBudget && Boolean(latestBudget);

  const budgetAlerts = useMemo(() => {
    const alerts: { type: 'warning' | 'danger'; message: string; month: string }[] = [];
    budgetsWithProgress.forEach((budget) => {
      if (budget.isOverBudget) {
        alerts.push({
          type: 'danger',
          message: `Over budget for ${getMonthName(budget.month)}`,
          month: budget.month,
        });
      } else if (budget.percentageUsed >= 100) {
        alerts.push({
          type: 'danger',
          message: `100% budget used for ${getMonthName(budget.month)}`,
          month: budget.month,
        });
      } else if (budget.percentageUsed >= 90) {
        alerts.push({
          type: 'danger',
          message: `90%+ budget used for ${getMonthName(budget.month)}`,
          month: budget.month,
        });
      } else if (budget.percentageUsed >= 75) {
        alerts.push({
          type: 'warning',
          message: `75%+ budget used for ${getMonthName(budget.month)}`,
          month: budget.month,
        });
      }
    });
    return alerts;
  }, [budgetsWithProgress]);

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      setDeletingId(id);
      await deleteBudget({ id });
    } catch (error) {
      console.error('Failed to delete budget', error);
      alert('Failed to delete budget.');
    } finally {
      setDeletingId(null);
    }
  };

  function getMonthName(monthKey: string) {
    const [year, month] = normalizeMonthKey(monthKey).split('-');
    return format(new Date(parseInt(year, 10), parseInt(month, 10) - 1), 'MMMM yyyy');
  }

  const getProgressColor = (percentage: number, isOverBudget: boolean) => {
    if (isOverBudget || percentage >= 90) return 'bg-destructive';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-primary';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">Set limits and monitor your spending goals.</p>
        </div>
        <Button onClick={handleOpenCreate} className="whitespace-nowrap">
          <Plus size={18} />
          Create Budget
        </Button>
      </div>

      {!isLoading && budgetAlerts.length > 0 ? (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <div className="space-y-3">
            <div>
              <AlertTitle>Budget Alerts</AlertTitle>
              <AlertDescription>
                Monthly budgets nearing or exceeding their limits.
              </AlertDescription>
            </div>
            <div className="space-y-2">
              {budgetAlerts.map((alert, index) => (
                <div key={`${alert.month}-${index}`} className="flex items-center justify-between gap-3">
                  <span className="text-sm">{alert.message}</span>
                  <Badge
                    variant="outline"
                    className={
                      alert.type === 'danger'
                        ? 'border-destructive/40 text-destructive'
                        : 'border-amber-500/40 text-amber-700 dark:text-amber-300'
                    }
                  >
                    {alert.type === 'danger' ? 'Critical' : 'Warning'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Alert>
      ) : null}

      {!isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-2xl">{getMonthName(currentMonth)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Spent</CardDescription>
              <CardTitle className="text-2xl text-amber-700 dark:text-amber-300">
                {currencyFormat(spendingByMonth[currentMonth] || 0, 'USD')}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Budgeted</CardDescription>
              <CardTitle className="text-2xl">
                {currencyFormat(summaryBudget?.total_amount || 0, 'USD')}
              </CardTitle>
            </CardHeader>
            {isUsingFallbackBudget && summaryBudget ? (
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Using {getMonthName(summaryBudget.month)} budget
                </p>
              </CardContent>
            ) : null}
          </Card>
        </div>
      ) : null}

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Monthly Budgets</CardTitle>
          <CardDescription>{budgetsWithProgress.length} entries</CardDescription>
        </CardHeader>
        {isLoading ? (
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`budget-skeleton-${index}`} className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </CardContent>
        ) : budgetsWithProgress.length === 0 ? (
          <CardContent>
            <EmptyState
              title="No budgets set"
              description="Create a budget to start taking control of your financial goals."
              actionLabel="Create Budget"
              onAction={handleOpenCreate}
            />
          </CardContent>
        ) : (
          <div className="divide-y divide-border">
            {budgetsWithProgress.map((budget) => (
              <div key={budget.id} className="p-4 sm:p-6 hover:bg-muted/40 transition-colors group">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{getMonthName(budget.month)}</h4>
                    <p className="text-sm text-muted-foreground">
                      Budget: {currencyFormat(budget.total_amount, 'USD')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold flex items-center gap-1 justify-end">
                      {budget.isOverBudget ? (
                        <TrendingUp size={16} className="text-destructive" />
                      ) : (
                        <TrendingDown size={16} className="text-emerald-600 dark:text-emerald-400" />
                      )}
                      {currencyFormat(Math.abs(budget.remaining), 'USD')}
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        budget.isOverBudget
                          ? 'border-destructive/40 text-destructive'
                          : 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                      }
                    >
                      {budget.isOverBudget ? 'Over budget' : 'Remaining'}
                    </Badge>
                  </div>
                </div>

                <div className="relative">
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getProgressColor(
                        budget.percentageUsed,
                        budget.isOverBudget
                      )}`}
                      style={{ width: `${budget.percentageUsed}%` }}
                    />
                  </div>
                  <div className="absolute right-0 -top-5 text-xs text-muted-foreground">
                    {budget.percentageUsed.toFixed(0)}%
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <p className="text-sm text-muted-foreground">
                    Spent: {currencyFormat(budget.spent, 'USD')}
                  </p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(budget)}
                      className="h-8 w-8"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(budget.id)}
                      disabled={deletingId === budget.id}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Delete"
                    >
                      {deletingId === budget.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        editingBudget={editingBudget}
      />
    </div>
  );
}
