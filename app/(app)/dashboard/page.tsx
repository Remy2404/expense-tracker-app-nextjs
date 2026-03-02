'use client';

import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { AiNudgesCard } from '@/components/dashboard/AiNudgesCard';
import { BudgetHealthCard } from '@/components/dashboard/BudgetHealthCard';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { RecentTransactionsCard } from '@/components/dashboard/RecentTransactionsCard';
import { ErrorState } from '@/components/state/ErrorState';
import { PageSkeleton } from '@/components/state/PageSkeleton';
import { Button } from '@/components/ui/button';
import { useAiNudges } from '@/hooks/useAi';
import { useBudgets, useCategories, useExpenses } from '@/hooks/useData';
import { getCurrencySymbol } from '@/lib/currencies';
import { isExpenseTransaction, isIncomeTransaction } from '@/lib/transactions';

export default function DashboardPage() {
  const {
    expenses,
    isLoading: expensesLoading,
    isError: expensesError,
    mutate: mutateExpenses,
  } = useExpenses();
  const {
    budgets,
    isLoading: budgetsLoading,
    isError: budgetsError,
    mutate: mutateBudgets,
  } = useBudgets();
  const {
    isLoading: categoriesLoading,
    isError: categoriesError,
    mutate: mutateCategories,
  } = useCategories();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const {
    data: nudgesData,
    isLoading: nudgesLoading,
    error: nudgesError,
    mutate: mutateNudges,
  } = useAiNudges();

  const isLoading = expensesLoading || budgetsLoading || categoriesLoading;
  const hasDataError = Boolean(expensesError || budgetsError || categoriesError);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const currentMonthTransactions = useMemo(() => {
    return expenses.filter((expense) => {
      const dateStr = typeof expense.date === 'string' ? expense.date : expense.date.toISOString();
      return dateStr.startsWith(currentMonth);
    });
  }, [expenses, currentMonth]);

  const totalExpense = useMemo(() => {
    return currentMonthTransactions
      .filter((expense) => isExpenseTransaction(expense))
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [currentMonthTransactions]);

  const totalIncome = useMemo(() => {
    return currentMonthTransactions
      .filter((expense) => isIncomeTransaction(expense))
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [currentMonthTransactions]);

  const totalBalance = useMemo(() => totalIncome - totalExpense, [totalExpense, totalIncome]);

  const currentBudget = useMemo(() => {
    return budgets.find((budget) => budget.month === currentMonth);
  }, [budgets, currentMonth]);

  const remainingBudget = useMemo(() => {
    if (!currentBudget) return 0;
    return currentBudget.total_amount - totalExpense;
  }, [currentBudget, totalExpense]);

  const recentTransactions = useMemo(() => {
    return [...expenses]
      .sort((a, b) => {
        const dateA = new Date(
          typeof a.date === 'string' ? a.date : a.date.toISOString()
        ).getTime();
        const dateB = new Date(
          typeof b.date === 'string' ? b.date : b.date.toISOString()
        ).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [expenses]);

  const handleRetryDashboard = () => {
    void Promise.all([mutateExpenses(), mutateBudgets(), mutateCategories()]);
  };

  const handleRetryNudges = () => {
    void mutateNudges();
  };

  return (
    <div className='space-y-6'>
      <header className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>Dashboard</h1>
          <p className='text-foreground/60'>Overview of your income, expenses, and balance.</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className='flex items-center gap-2 whitespace-nowrap'
          aria-label='Add a new transaction'
        >
          <Plus size={18} />
          New Transaction
        </Button>
      </header>

      {isLoading ? (
        <PageSkeleton cards={4} rows={7} />
      ) : hasDataError ? (
        <ErrorState
          title='Failed to load dashboard data'
          description='Please retry to load your latest expenses, budgets, and categories.'
          onRetry={handleRetryDashboard}
        />
      ) : (
        <div className='grid grid-cols-1 items-start gap-6 xl:grid-cols-12'>
          <section className='xl:col-span-8' aria-labelledby='dashboard-summary-heading'>
            <h2 id='dashboard-summary-heading' className='sr-only'>
              Monthly summary
            </h2>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              <DashboardStatCard
                title='Income'
                value={`+${getCurrencySymbol('USD')}${totalIncome.toFixed(2)}`}
                subtitle='Current month'
                badgeLabel='Money in'
                valueClassName='text-emerald-600'
              />
              <DashboardStatCard
                title='Expenses'
                value={`-${getCurrencySymbol('USD')}${totalExpense.toFixed(2)}`}
                subtitle='Current month'
                badgeLabel='Money out'
                valueClassName='text-destructive'
              />
              <DashboardStatCard
                title='Balance'
                value={`${totalBalance >= 0 ? '+' : '-'}${getCurrencySymbol('USD')}${Math.abs(totalBalance).toFixed(2)}`}
                subtitle={totalBalance >= 0 ? 'Net positive' : 'Net negative'}
                badgeLabel={
                  currentMonthTransactions.length > 0
                    ? `${currentMonthTransactions.length} transactions`
                    : 'No transactions'
                }
                valueClassName={totalBalance >= 0 ? 'text-emerald-600' : 'text-destructive'}
              />
            </div>
          </section>

          <section className='xl:col-span-4' aria-labelledby='dashboard-budget-health-heading'>
            <h2 id='dashboard-budget-health-heading' className='sr-only'>
              Budget health
            </h2>
            <BudgetHealthCard
              hasCurrentBudget={Boolean(currentBudget)}
              totalBudget={currentBudget?.total_amount ?? 0}
              totalSpent={totalExpense}
              remainingBudget={remainingBudget}
            />
          </section>

          <section className='xl:col-span-7' aria-labelledby='dashboard-transactions-heading'>
            <h2 id='dashboard-transactions-heading' className='sr-only'>
              Recent transactions
            </h2>
            <RecentTransactionsCard
              recentTransactions={recentTransactions}
              onAddExpense={() => setIsAddModalOpen(true)}
            />
          </section>

          <section className='xl:col-span-5' aria-labelledby='dashboard-ai-nudges-heading'>
            <h2 id='dashboard-ai-nudges-heading' className='sr-only'>
              AI nudges
            </h2>
            <AiNudgesCard
              data={nudgesData}
              isLoading={nudgesLoading}
              isError={Boolean(nudgesError)}
              onRetry={handleRetryNudges}
            />
          </section>
        </div>
      )}

      <AddExpenseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
