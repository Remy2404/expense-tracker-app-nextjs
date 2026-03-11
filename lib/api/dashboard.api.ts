import { aiHttpClient } from '@/lib/api/http';

export interface DashboardSummaryResponse {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummaryResponse> {
    const response = await aiHttpClient.get('/api/dashboard/summary');
    const data = response.data || {};
    return {
      totalIncome: data.totalIncome ?? data.total_income ?? 0,
      totalExpense: data.totalExpense ?? data.total_expense ?? 0,
      balance: data.balance ?? 0,
      transactionCount: data.transactionCount ?? data.transaction_count ?? 0,
      monthlyIncome: data.monthlyIncome ?? data.monthly_income ?? 0,
      monthlyExpense: data.monthlyExpense ?? data.monthly_expense ?? 0,
    };
  },
};
