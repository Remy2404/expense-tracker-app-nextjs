import { aiHttpClient } from '@/lib/api/http';

export type FinanceSummaryPeriod = 'all-time' | 'this-month';

export interface FinanceSummaryResponse {
  period: FinanceSummaryPeriod;
  periodStart: string | null;
  periodEnd: string | null;
  transactionCount: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export const financeApi = {
  async getSummary(period: FinanceSummaryPeriod = 'all-time'): Promise<FinanceSummaryResponse> {
    const response = await aiHttpClient.get('/api/finance/summary', { params: { period } });
    const data = response.data || {};
    return {
      period: data.period || period,
      periodStart: data.periodStart ?? data.period_start,
      periodEnd: data.periodEnd ?? data.period_end,
      transactionCount: data.transactionCount ?? data.transaction_count ?? 0,
      totalIncome: data.totalIncome ?? data.total_income ?? 0,
      totalExpense: data.totalExpense ?? data.total_expense ?? 0,
      balance: data.balance ?? 0,
    };
  },
};
