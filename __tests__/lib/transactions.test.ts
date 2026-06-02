import { getTransactionDisplayTitle } from '@/lib/transactions';

describe('getTransactionDisplayTitle', () => {
  it('uses a meaningful note before merchant or category fallback', () => {
    expect(
      getTransactionDisplayTitle(
        {
          transaction_type: 'expense',
          notes: 'Coffee',
          merchant: 'Brown Coffee',
        },
        'Food'
      )
    ).toBe('Coffee');
  });

  it('uses an explicit merchant when no meaningful note exists', () => {
    expect(
      getTransactionDisplayTitle({
        transaction_type: 'expense',
        merchant: 'Brown Coffee',
      })
    ).toBe('Brown Coffee');
  });

  it('replaces legacy generic notes with category and transaction type', () => {
    expect(
      getTransactionDisplayTitle(
        {
          transaction_type: 'expense',
          notes: 'Transaction',
          note: 'AI transaction',
        },
        'Food'
      )
    ).toBe('Food expense');
  });

  it('uses an unnamed fallback when no useful text or category exists', () => {
    expect(
      getTransactionDisplayTitle({
        transaction_type: 'income',
      })
    ).toBe('Unnamed income');
  });

  it('ignores serialized null notes and uses the category fallback', () => {
    expect(
      getTransactionDisplayTitle(
        {
          transaction_type: 'expense',
          notes: 'Null',
        },
        'Uncategorized'
      )
    ).toBe('Unnamed expense');
  });
});
