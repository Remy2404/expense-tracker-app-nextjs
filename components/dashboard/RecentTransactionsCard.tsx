import { EmptyState } from '@/components/state/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrencySymbol } from '@/lib/currencies';
import { Expense } from '@/types';

type RecentTransactionsCardProps = {
  recentTransactions: Expense[];
  onAddExpense: () => void;
};

export function RecentTransactionsCard({
  recentTransactions,
  onAddExpense,
}: RecentTransactionsCardProps) {
  return (
    <Card className='h-full'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
        <CardTitle className='text-base'>Recent Transactions</CardTitle>
        <Badge variant='secondary'>{recentTransactions.length}</Badge>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <EmptyState
            title='No recent transactions'
            description='Add your first expense to start tracking monthly trends.'
            actionLabel='Add Expense'
            onAction={onAddExpense}
          />
        ) : (
          <ul className='space-y-3' aria-label='Recent transactions list'>
            {recentTransactions.map((expense) => (
              <li
                key={expense.id}
                className='flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5'
              >
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>{expense.notes || 'Expense'}</p>
                  <p className='text-xs text-muted-foreground'>
                    <time dateTime={new Date(expense.date).toISOString()}>
                      {new Date(expense.date).toLocaleDateString()}
                    </time>
                  </p>
                </div>
                <p className='shrink-0 text-sm font-semibold'>
                  {getCurrencySymbol(expense.currency || 'USD')}
                  {expense.amount.toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
