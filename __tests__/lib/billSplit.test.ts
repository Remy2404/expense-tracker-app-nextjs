import { currencyFormat, normalizeGroupSummary, toFiniteNumber } from '@/lib/billSplit';

describe('billSplit helpers', () => {
  it('normalizes snake_case group summary payloads from the backend', () => {
    const group = normalizeGroupSummary({
      id: 'group-1',
      name: 'Dinner',
      currency: 'KHR',
      created_by: 'user-1',
      created_at: '2026-03-19T00:00:00Z',
      participants_count: 3,
      expenses_count: 1,
      unsettled_shares_count: 2,
      total_expenses: '12.5',
    });

    expect(group.participantsCount).toBe(3);
    expect(group.expensesCount).toBe(1);
    expect(group.unsettledSharesCount).toBe(2);
    expect(group.totalExpenses).toBe(12.5);
  });

  it('falls back to zero for invalid numeric values', () => {
    expect(toFiniteNumber(undefined)).toBe(0);
    expect(toFiniteNumber('not-a-number')).toBe(0);
    expect(currencyFormat(undefined, 'USD')).toBe('$0.00');
  });
});
