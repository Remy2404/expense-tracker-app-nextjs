import { EmptyState } from '@/components/state/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrencySymbol } from '@/lib/currencies';
import { Expense } from '@/types';
import { getSignedTransactionAmount, getTransactionType } from '@/lib/transactions';

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
            description='Add your first transaction to start tracking monthly trends.'
            actionLabel='Add Transaction'
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
                  <p className='truncate text-sm font-medium'>{expense.notes || expense.note || 'Transaction'}</p>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <time dateTime={new Date(expense.date).toISOString()}>
                      {new Date(expense.date).toLocaleDateString()}
                    </time>
                    <Badge variant={getTransactionType(expense) === 'income' ? 'default' : 'secondary'}>
                      {getTransactionType(expense) === 'income' ? 'Income' : 'Expense'}
                    </Badge>
                  </div>
                </div>
                <p
                  className={`shrink-0 text-sm font-semibold ${
                    getSignedTransactionAmount(expense) >= 0 ? 'text-emerald-600' : 'text-destructive'
                  }`}
                >
                  {getSignedTransactionAmount(expense) >= 0 ? '+' : '-'}
                  {getCurrencySymbol(expense.currency || 'USD')}
                  {Math.abs(expense.amount).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
