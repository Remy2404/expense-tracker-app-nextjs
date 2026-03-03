import { sortExpensesByRecency } from '@/lib/expenseSort';

describe('expenseSort (web)', () => {
  it('prioritizes created_at over updated_at to match mobile ordering', () => {
    const olderButEdited = {
      id: 'older-edited',
      date: '2026-03-03T00:00:00.000Z',
      created_at: '2026-03-03T10:00:00.000Z',
      updated_at: '2026-03-03T12:00:00.000Z',
    };
    const newerInsert = {
      id: 'newer-insert',
      date: '2026-03-03T00:00:00.000Z',
      created_at: '2026-03-03T11:00:00.000Z',
      updated_at: '2026-03-03T11:00:00.000Z',
    };

    const result = sortExpensesByRecency([olderButEdited, newerInsert]);
    expect(result.map((item) => item.id)).toEqual(['newer-insert', 'older-edited']);
  });

  it('uses updated_at as tie-breaker when created_at is equal', () => {
    const first = {
      id: 'first',
      date: '2026-03-03T00:00:00.000Z',
      created_at: '2026-03-03T10:00:00.000Z',
      updated_at: '2026-03-03T10:01:00.000Z',
    };
    const second = {
      id: 'second',
      date: '2026-03-03T00:00:00.000Z',
      created_at: '2026-03-03T10:00:00.000Z',
      updated_at: '2026-03-03T10:00:00.000Z',
    };

    const result = sortExpensesByRecency([second, first]);
    expect(result.map((item) => item.id)).toEqual(['first', 'second']);
  });

  it('falls back to date and then id when created_at and updated_at are absent', () => {
    const olderDate = {
      id: 'aaa',
      date: '2026-03-02T00:00:00.000Z',
      created_at: undefined,
      updated_at: undefined,
    };
    const newerDate = {
      id: 'zzz',
      date: '2026-03-03T00:00:00.000Z',
      created_at: undefined,
      updated_at: undefined,
    };
    const sameDateDifferentId = {
      id: 'mmm',
      date: '2026-03-03T00:00:00.000Z',
      created_at: undefined,
      updated_at: undefined,
    };

    const result = sortExpensesByRecency([olderDate, sameDateDifferentId, newerDate]);
    expect(result.map((item) => item.id)).toEqual(['zzz', 'mmm', 'aaa']);
  });
});
