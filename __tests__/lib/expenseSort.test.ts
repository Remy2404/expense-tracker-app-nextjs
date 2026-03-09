import { sortExpensesByRecency } from '@/lib/expenseSort';

describe('expenseSort (web)', () => {
  it('sorts by transaction date desc first', () => {
    const olderDate = {
      id: 'older-date',
      date: '2026-03-02T00:00:00.000Z',
      created_at: '2026-03-03T11:00:00.000Z',
      updated_at: '2026-03-03T11:00:00.000Z',
    };
    const newerDate = {
      id: 'newer-date',
      date: '2026-03-03T00:00:00.000Z',
      created_at: '2026-03-03T10:00:00.000Z',
      updated_at: '2026-03-03T10:00:00.000Z',
    };

    const result = sortExpensesByRecency([olderDate, newerDate]);
    expect(result.map((item) => item.id)).toEqual(['newer-date', 'older-date']);
  });

  it('uses updated_at as tie-breaker when dates match', () => {
    const olderUpdate = {
      id: 'older-update',
      date: '2026-03-03T00:00:00.000Z',
      created_at: '2026-03-03T10:00:00.000Z',
      updated_at: '2026-03-03T10:00:00.000Z',
    };
    const newerUpdate = {
      id: 'newer-update',
      date: '2026-03-03T00:00:00.000Z',
      created_at: '2026-03-03T09:00:00.000Z',
      updated_at: '2026-03-03T10:01:00.000Z',
    };

    const result = sortExpensesByRecency([olderUpdate, newerUpdate]);
    expect(result.map((item) => item.id)).toEqual(['newer-update', 'older-update']);
  });

  it('falls back to created_at and then id when date and updated_at tie', () => {
    const olderInsert = {
      id: 'older-insert',
      date: '2026-03-03T00:00:00.000Z',
      created_at: '2026-03-03T10:00:00.000Z',
      updated_at: undefined,
    };
    const newerInsert = {
      id: 'newer-insert',
      date: '2026-03-03T00:00:00.000Z',
      created_at: '2026-03-03T11:00:00.000Z',
      updated_at: undefined,
    };
    const sameTimeDifferentId = {
      id: 'zzz',
      date: '2026-03-03T00:00:00.000Z',
      created_at: '2026-03-03T11:00:00.000Z',
      updated_at: undefined,
    };

    const result = sortExpensesByRecency([olderInsert, sameTimeDifferentId, newerInsert]);
    expect(result.map((item) => item.id)).toEqual(['zzz', 'newer-insert', 'older-insert']);
  });
});
