"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { AiNudgesCard } from "@/components/dashboard/AiNudgesCard";
import { BudgetHealthCard } from "@/components/dashboard/BudgetHealthCard";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { RecentTransactionsCard } from "@/components/dashboard/RecentTransactionsCard";
import { ErrorState } from "@/components/state/ErrorState";
import { PageSkeleton } from "@/components/state/PageSkeleton";
import { Button } from "@/components/ui/button";
import { useAiNudges } from "@/hooks/useAi";
import {
  useBudgetSummary,
  useCategories,
  useDashboardSummary,
  useExpenses,
} from "@/hooks/useData";
import { getCurrencySymbol } from "@/lib/currencies";
import { toYearMonthKey } from "@/lib/dates";
import { sortExpensesByTransactionDateTime } from "@/lib/expenseSort";

export default function DashboardPage() {
  const {
    expenses,
    isLoading: expensesLoading,
    isError: expensesError,
    mutate: mutateExpenses,
  } = useExpenses();
  const currentMonth = toYearMonthKey(new Date());
  const {
    summary,
    isLoading: summaryLoading,
    isError: summaryError,
    mutate: mutateSummary,
  } = useDashboardSummary();
  const {
    summary: budgetSummary,
    isLoading: budgetSummaryLoading,
    isError: budgetSummaryError,
    mutate: mutateBudgetSummary,
  } = useBudgetSummary(currentMonth);
  const {
    categories,
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

  const isLoading =
    expensesLoading ||
    categoriesLoading ||
    summaryLoading ||
    budgetSummaryLoading;
  const hasDataError = Boolean(
    expensesError || categoriesError || summaryError || budgetSummaryError,
  );
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const totalBalance = summary?.balance ?? 0;
  const transactionCount = summary?.transactionCount ?? 0;
  const currentMonthExpense = budgetSummary?.spent ?? 0;
  const totalBudget = budgetSummary?.budgetLimit ?? 0;
  const remainingBudget = budgetSummary?.remaining ?? 0;
  const hasCurrentBudget = totalBudget > 0;

  const recentTransactions = useMemo(() => {
    return sortExpensesByTransactionDateTime(
      expenses.filter((expense) => !expense.is_deleted),
    ).slice(0, 5);
  }, [expenses]);

  const handleRetryDashboard = () => {
    void Promise.all([
      mutateExpenses(),
      mutateCategories(),
      mutateSummary(),
      mutateBudgetSummary(),
    ]);
  };

  const handleRetryNudges = () => {
    void mutateNudges();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Dashboard
          </h1>
          <p className="text-foreground/60">
            Overview of your income, expenses, and balance.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 whitespace-nowrap"
          aria-label="Add a new transaction"
        >
          <Plus size={18} />
          New Transaction
        </Button>
      </header>

      {isLoading ? (
        <PageSkeleton cards={4} rows={7} />
      ) : hasDataError ? (
        <ErrorState
          title="Failed to load dashboard data"
          description="Please retry to load your latest expenses, budgets, and categories."
          onRetry={handleRetryDashboard}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]">
            <section aria-labelledby="dashboard-summary-heading">
              <h2 id="dashboard-summary-heading" className="sr-only">
                Monthly summary
              </h2>
              <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                <DashboardStatCard
                  title="Income"
                  value={`+${getCurrencySymbol("USD")}${totalIncome.toFixed(2)}`}
                  subtitle="All time"
                  badgeLabel="Money in"
                  valueClassName="text-emerald-600"
                />
                <DashboardStatCard
                  title="Expenses"
                  value={`-${getCurrencySymbol("USD")}${totalExpense.toFixed(2)}`}
                  subtitle="All time"
                  badgeLabel="Money out"
                  valueClassName="text-destructive"
                />
                <DashboardStatCard
                  title="Balance"
                  value={`${totalBalance >= 0 ? "+" : "-"}${getCurrencySymbol("USD")}${Math.abs(totalBalance).toFixed(2)}`}
                  subtitle={totalBalance >= 0 ? "Net positive" : "Net negative"}
                  badgeLabel={
                    transactionCount > 0
                      ? `${transactionCount} transactions`
                      : "No transactions"
                  }
                  valueClassName={
                    totalBalance >= 0 ? "text-emerald-600" : "text-destructive"
                  }
                />
              </div>
            </section>

            <section
              className="xl:min-w-[20rem]"
              aria-labelledby="dashboard-budget-health-heading"
            >
              <h2 id="dashboard-budget-health-heading" className="sr-only">
                Budget health
              </h2>
              <BudgetHealthCard
                hasCurrentBudget={hasCurrentBudget}
                totalBudget={totalBudget}
                totalSpent={currentMonthExpense}
                remainingBudget={remainingBudget}
              />
            </section>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,1fr)]">
            <section aria-labelledby="dashboard-transactions-heading">
              <h2 id="dashboard-transactions-heading" className="sr-only">
                Recent transactions
              </h2>
              <RecentTransactionsCard
                recentTransactions={recentTransactions}
                categories={categories}
                onAddExpense={() => setIsAddModalOpen(true)}
              />
            </section>

            <section aria-labelledby="dashboard-ai-nudges-heading">
              <h2 id="dashboard-ai-nudges-heading" className="sr-only">
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
        </div>
      )}

      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
