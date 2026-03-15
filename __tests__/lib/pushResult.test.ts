import { getSyncPushFailureMessage } from '@/lib/sync/pushResult';

describe('getSyncPushFailureMessage', () => {
  it('returns null when sync has no failed items', () => {
    const message = getSyncPushFailureMessage({
      synced_items: {
        expenses: 1,
        categories: 0,
        budgets: 0,
        goals: 0,
        recurring: 0,
        bill_split: 0,
      },
      failed_items: [],
    });

    expect(message).toBeNull();
  });

  it('returns human-readable error when sync has failed items', () => {
    const message = getSyncPushFailureMessage({
      synced_items: {
        expenses: 1,
        categories: 0,
        budgets: 0,
        goals: 0,
        recurring: 0,
        bill_split: 0,
      },
      failed_items: [
        { id: 'exp-1', entity_type: 'expense', error: 'Stale expense update' },
        { id: 'cat-1', entity_type: 'category', error: 'Invalid category reference' },
      ],
    });

    expect(message).toBe(
      'Sync failed for 2 item(s): expense:exp-1 (Stale expense update), category:cat-1 (Invalid category reference)'
    );
  });
});
