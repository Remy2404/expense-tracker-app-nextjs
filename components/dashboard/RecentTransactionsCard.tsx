import { useMemo } from "react";
import { EmptyState } from "@/components/state/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrencySymbol } from "@/lib/currencies";
import { toSafeDate } from "@/lib/dates";
import { sortExpensesByTransactionDateTime } from "@/lib/expenseSort";
import { Category, Expense } from "@/types";
import { getSignedTransactionAmount } from "@/lib/transactions";

type RecentTransactionsCardProps = {
  recentTransactions: Expense[];
  categories: Category[];
  onAddExpense: () => void;
};

export function RecentTransactionsCard({
  recentTransactions,
  categories,
  onAddExpense,
}: RecentTransactionsCardProps) {
  const sortedRecentTransactions = useMemo(
    () => sortExpensesByTransactionDateTime(recentTransactions),
    [recentTransactions],
  );
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Recent Transactions</CardTitle>
        <Badge variant="secondary">{sortedRecentTransactions.length}</Badge>
      </CardHeader>
      <CardContent>
        {sortedRecentTransactions.length === 0 ? (
          <EmptyState
            title="No recent transactions"
            description="Add your first transaction to start tracking monthly trends."
            actionLabel="Add Transaction"
            onAction={onAddExpense}
          />
        ) : (
          <ul className="space-y-3" aria-label="Recent transactions list">
            {sortedRecentTransactions.map((expense) => {
              const categoryName = expense.category_id
                ? (categoryNameById.get(expense.category_id) ?? "Uncategorized")
                : undefined;
              const subtitleCategory = categoryName ?? "Uncategorized";
              const title =
                expense.notes ||
                expense.note ||
                expense.merchant ||
                categoryName ||
                "Transaction";

              return (
                <li
                  key={expense.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{subtitleCategory}</span>
                      <span aria-hidden="true">&bull;</span>
                      <time dateTime={toSafeDate(expense.date).toISOString()}>
                        {toSafeDate(expense.date).toLocaleDateString()}
                      </time>
                    </div>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold ${
                      getSignedTransactionAmount(expense) >= 0
                        ? "text-emerald-600"
                        : "text-destructive"
                    }`}
                  >
                    {getSignedTransactionAmount(expense) >= 0 ? "+" : "-"}
                    {getCurrencySymbol(expense.currency || "USD")}
                    {Math.abs(expense.amount).toFixed(2)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
