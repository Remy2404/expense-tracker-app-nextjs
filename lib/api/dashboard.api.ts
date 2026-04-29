import { aiHttpClient } from '@/lib/api/http';

export interface DashboardSummaryResponse {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  monthlyIncome: number;
  monthlyExpense: number;
  budgetSummary?: {
    month: string;
    budgetLimit: number;
    spent: number;
    remaining: number;
  } | null;
  recentTransactions?: Array<{
    id: string;
    amount: number;
    transactionType: string | null;
    currency: string | null;
    merchant: string | null;
    date: string | null;
    note: string | null;
    noteSummary: string | null;
    categoryId: string | null;
    isDeleted: boolean;
    categoryName: string | null;
  }>;
  recentCategories?: Array<{
    id: string;
    name: string;
  }>;
}

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummaryResponse> {
    const response = await aiHttpClient.get('/api/dashboard/summary');
    const data = response.data || {};
    const budgetSummaryRaw = data.budgetSummary ?? data.budget_summary ?? null;
    const budgetSummary = budgetSummaryRaw
      ? {
          month: String(budgetSummaryRaw.month ?? ''),
          budgetLimit: Number(budgetSummaryRaw.budgetLimit ?? budgetSummaryRaw.budget_limit ?? 0),
          spent: Number(budgetSummaryRaw.spent ?? 0),
          remaining: Number(budgetSummaryRaw.remaining ?? 0),
        }
      : null;

    const recentTransactionsRaw = Array.isArray(data.recentTransactions ?? data.recent_transactions)
      ? (data.recentTransactions ?? data.recent_transactions)
      : [];
    const recentTransactions = recentTransactionsRaw.map((item: Record<string, unknown>) => ({
      id: String(item.id ?? ''),
      amount: Number(item.amount ?? 0),
      transactionType: (item.transactionType ?? item.transaction_type ?? null) as string | null,
      currency: (item.currency ?? null) as string | null,
      merchant: (item.merchant ?? null) as string | null,
      date: (item.date ?? null) as string | null,
      note: (item.note ?? null) as string | null,
      noteSummary: (item.noteSummary ?? item.note_summary ?? null) as string | null,
      categoryId: (item.categoryId ?? item.category_id ?? null) as string | null,
      isDeleted: Boolean(item.isDeleted ?? item.is_deleted ?? item.deleted),
      categoryName: (item.categoryName ?? item.category_name ?? null) as string | null,
    }));

    const recentCategoriesRaw = Array.isArray(data.recentCategories ?? data.recent_categories)
      ? (data.recentCategories ?? data.recent_categories)
      : [];
    const recentCategories = recentCategoriesRaw.map((item: Record<string, unknown>) => ({
      id: String(item.id ?? ''),
      name: String(item.name ?? ''),
    }));

    return {
      totalIncome: data.totalIncome ?? data.total_income ?? 0,
      totalExpense: data.totalExpense ?? data.total_expense ?? 0,
      balance: data.balance ?? 0,
      transactionCount: data.transactionCount ?? data.transaction_count ?? 0,
      monthlyIncome: data.monthlyIncome ?? data.monthly_income ?? 0,
      monthlyExpense: data.monthlyExpense ?? data.monthly_expense ?? 0,
      budgetSummary,
      recentTransactions,
      recentCategories,
    };
  },
};
