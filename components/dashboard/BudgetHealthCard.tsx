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
    <Card className="h-full group overflow-hidden relative">
      {/* Gradient overlay based on budget status */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        isOverBudget
          ? "bg-gradient-to-br from-destructive/10 via-transparent to-transparent"
          : "bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent"
      )} />

      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base transition-colors group-hover:text-primary">Budget Health</CardTitle>
          <Badge variant={statusBadgeVariant} className="transition-transform group-hover:scale-105">{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        <dl className="grid grid-cols-3 gap-4 text-sm">
          <div className="min-w-0 space-y-2">
            <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Budgeted
            </dt>
            <dd className="truncate text-base font-semibold tabular-nums transition-transform group-hover:scale-105">
              {formatMoney(totalBudget, currencyCode)}
            </dd>
          </div>
          <div className="min-w-0 space-y-2">
            <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Spent
            </dt>
            <dd className="truncate text-base font-semibold tabular-nums transition-transform group-hover:scale-105">
              {formatMoney(totalSpent, currencyCode)}
            </dd>
          </div>
          <div className="min-w-0 space-y-2">
            <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Remaining
            </dt>
            <dd
              className={cn(
                'truncate text-base font-semibold tabular-nums transition-transform group-hover:scale-105',
                remainingBudget < 0 ? 'text-destructive' : 'text-emerald-600'
              )}
            >
              {formatMoney(remainingBudget, currencyCode)}
            </dd>
          </div>
        </dl>

        {!hasCurrentBudget ? (
          <Alert className="animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No monthly budget yet</AlertTitle>
            <AlertDescription>
              Add a budget for this month to track your remaining amount in real time.
            </AlertDescription>
          </Alert>
        ) : isOverBudget ? (
          <Alert variant="destructive" className="animate-fade-in">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Budget exceeded</AlertTitle>
            <AlertDescription>
              You are over budget by {formatMoney(Math.abs(remainingBudget), currencyCode)}.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
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
