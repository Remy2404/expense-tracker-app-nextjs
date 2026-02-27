import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrencySymbol } from '@/lib/currencies';
import { cn } from '@/lib/utils';

type BudgetHealthCardProps = {
  hasCurrentBudget: boolean;
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  currencyCode?: string;
};

const formatMoney = (amount: number, currencyCode: string) =>
  `${getCurrencySymbol(currencyCode)}${amount.toFixed(2)}`;

export function BudgetHealthCard({
  hasCurrentBudget,
  totalBudget,
  totalSpent,
  remainingBudget,
  currencyCode = 'USD',
}: BudgetHealthCardProps) {
  const isOverBudget = hasCurrentBudget && remainingBudget < 0;
  const statusLabel = !hasCurrentBudget ? 'No budget' : isOverBudget ? 'Over budget' : 'On track';
  const statusBadgeVariant = isOverBudget ? 'default' : 'secondary';

  return (
    <Card className='h-full'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle className='text-base'>Budget Health</CardTitle>
          <Badge variant={statusBadgeVariant}>{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <dl className='grid grid-cols-3 gap-3 text-sm'>
          <div className='space-y-1'>
            <dt className='text-muted-foreground'>Budgeted</dt>
            <dd className='font-semibold'>{formatMoney(totalBudget, currencyCode)}</dd>
          </div>
          <div className='space-y-1'>
            <dt className='text-muted-foreground'>Spent</dt>
            <dd className='font-semibold'>{formatMoney(totalSpent, currencyCode)}</dd>
          </div>
          <div className='space-y-1'>
            <dt className='text-muted-foreground'>Remaining</dt>
            <dd
              className={cn(
                'font-semibold',
                remainingBudget < 0 ? 'text-destructive' : 'text-emerald-600'
              )}
            >
              {formatMoney(remainingBudget, currencyCode)}
            </dd>
          </div>
        </dl>

        {!hasCurrentBudget ? (
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>No monthly budget yet</AlertTitle>
            <AlertDescription>
              Add a budget for this month to track your remaining amount in real time.
            </AlertDescription>
          </Alert>
        ) : isOverBudget ? (
          <Alert variant='destructive'>
            <ShieldAlert className='h-4 w-4' />
            <AlertTitle>Budget exceeded</AlertTitle>
            <AlertDescription>
              You are over budget by {formatMoney(Math.abs(remainingBudget), currencyCode)}.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <CheckCircle2 className='h-4 w-4 text-emerald-600' />
            <AlertTitle>Spending is under control</AlertTitle>
            <AlertDescription>
              You still have {formatMoney(remainingBudget, currencyCode)} available this month.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
