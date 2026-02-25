'use client';

import { useState, useMemo } from 'react';
import { Plus, Target, Edit2, Trash2, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { Budget } from '@/types';
import { BudgetModal } from '@/components/BudgetModal';
import { useBudgets, useDeleteBudget, useExpenses } from '@/hooks/useData';
import { currencyFormat } from '@/lib/billSplit';
import { format } from 'date-fns';

export default function BudgetsPage() {
  const { budgets, isLoading: isLoadingBudgets } = useBudgets();
  const { expenses, isLoading: isLoadingExpenses } = useExpenses();
  const { trigger: deleteBudget } = useDeleteBudget();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isLoading = isLoadingBudgets || isLoadingExpenses;

  // Calculate spending per month
  const spendingByMonth = useMemo(() => {
    const spending: Record<string, number> = {};
    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthKey = format(date, 'yyyy-MM');
      spending[monthKey] = (spending[monthKey] || 0) + expense.amount;
    });
    return spending;
  }, [expenses]);

  // Get current month key
  const currentMonth = format(new Date(), 'yyyy-MM');

  // Calculate budget progress for each budget
  const budgetsWithProgress = useMemo(() => {
    return budgets.map((budget) => {
      const spent = spendingByMonth[budget.month] || 0;
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

  const getMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy');
  };

  const getProgressColor = (percentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return 'bg-red-500';
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-primary';
  };

  // Get alert messages for budgets
  const getBudgetAlerts = () => {
    const alerts: { type: 'warning' | 'danger'; message: string; month: string }[] = [];
    budgetsWithProgress.forEach((budget) => {
      if (budget.isOverBudget) {
        alerts.push({ type: 'danger', message: `Over budget for ${getMonthName(budget.month)}`, month: budget.month });
      } else if (budget.percentageUsed >= 100) {
        alerts.push({ type: 'danger', message: `100% budget used for ${getMonthName(budget.month)}`, month: budget.month });
      } else if (budget.percentageUsed >= 90) {
        alerts.push({ type: 'danger', message: `90%+ budget used for ${getMonthName(budget.month)}`, month: budget.month });
      } else if (budget.percentageUsed >= 75) {
        alerts.push({ type: 'warning', message: `75%+ budget used for ${getMonthName(budget.month)}`, month: budget.month });
      }
    });
    return alerts;
  };

  const budgetAlerts = getBudgetAlerts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-foreground/60">Set limits and monitor your spending goals.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <Plus size={18} />
          Create Budget
        </button>
      </div>

      {/* Budget Alerts */}
      {!isLoading && budgetAlerts.length > 0 && (
        <div className="border border-amber-200 dark:border-amber-800 rounded-xl bg-amber-50 dark:bg-amber-950/20 overflow-hidden">
          <div className="p-4 border-b border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">Budget Alerts</h3>
          </div>
          <div className="divide-y divide-amber-200 dark:divide-amber-800">
            {budgetAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 flex items-center gap-2 ${
                  alert.type === 'danger' ? 'bg-red-50 dark:bg-red-950/20' : 'bg-amber-50 dark:bg-amber-950/20'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    alert.type === 'danger' ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                />
                <span className="text-sm text-amber-900 dark:text-amber-100">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Month Summary */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-foreground/60">This Month</p>
            <p className="text-2xl font-bold mt-1">{getMonthName(currentMonth)}</p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-foreground/60">Spent</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">
              {currencyFormat(spendingByMonth[currentMonth] || 0, 'USD')}
            </p>
          </div>
          <div className="border border-border rounded-xl p-4 bg-card">
            <p className="text-sm text-foreground/60">Budgeted</p>
            <p className="text-2xl font-bold mt-1">
              {currencyFormat(
                budgets.find((b) => b.month === currentMonth)?.total_amount || 0,
                'USD'
              )}
            </p>
          </div>
        </div>
      )}

      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : budgetsWithProgress.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mb-4 text-foreground/40">
              <Target size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-2">No budgets set</h3>
            <p className="text-foreground/60 max-w-sm mb-6">
              Create a budget to start taking control of your financial goals.
            </p>
            <button
              onClick={handleOpenCreate}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Create Budget
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {budgetsWithProgress.map((budget) => (
              <div key={budget.id} className="p-4 sm:p-6 hover:bg-foreground/5 transition-colors group">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{getMonthName(budget.month)}</h4>
                    <p className="text-sm text-foreground/60">
                      Budget: {currencyFormat(budget.total_amount, 'USD')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold flex items-center gap-1">
                      {budget.isOverBudget ? (
                        <TrendingUp size={16} className="text-red-500" />
                      ) : (
                        <TrendingDown size={16} className="text-green-500" />
                      )}
                      {currencyFormat(Math.abs(budget.remaining), 'USD')}
                    </p>
                    <p className="text-sm text-foreground/60">
                      {budget.isOverBudget ? 'Over budget' : 'Remaining'}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="w-full bg-border rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getProgressColor(budget.percentageUsed, budget.isOverBudget)}`}
                      style={{ width: `${budget.percentageUsed}%` }}
                    />
                  </div>
                  <div className="absolute right-0 -top-5 text-xs text-foreground/60">
                    {budget.percentageUsed.toFixed(0)}%
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <p className="text-sm text-foreground/60">
                    Spent: {currencyFormat(budget.spent, 'USD')}
                  </p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(budget)}
                      className="p-2 text-foreground/60 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      disabled={deletingId === budget.id}
                      className="p-2 text-foreground/60 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === budget.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
