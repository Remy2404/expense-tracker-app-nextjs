import { aiHttpClient } from '@/lib/api/http';

export interface BudgetSummaryResponse {
  budgetLimit: number;
  spent: number;
  remaining: number;
}

export const budgetApi = {
  async getSummary(month: string): Promise<BudgetSummaryResponse> {
    const response = await aiHttpClient.get('/api/budgets/summary', { params: { month } });
    const data = response.data || {};
    return {
      budgetLimit: data.budgetLimit ?? data.budget_limit ?? 0,
      spent: data.spent ?? 0,
      remaining: data.remaining ?? 0,
    };
  },
};
