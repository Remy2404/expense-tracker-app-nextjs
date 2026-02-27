'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Loader2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getCurrencySymbol } from '@/lib/currencies';
import { Expense } from '@/types';
import { cn } from '@/lib/utils';

type DeleteExpenseDialogProps = {
  expense: Expense | null;
  isDeleting: boolean;
  errorMessage: string | null;
  onConfirm: () => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
};

export function DeleteExpenseDialog({
  expense,
  isDeleting,
  errorMessage,
  onConfirm,
  onOpenChange,
}: DeleteExpenseDialogProps) {
  const note = expense?.notes || expense?.note || 'Expense';
  const amount = expense ? `${getCurrencySymbol(expense.currency || 'USD')}${expense.amount.toFixed(2)}` : '';

  return (
    <DialogPrimitive.Root open={Boolean(expense)} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2',
            'rounded-xl border border-border bg-background p-5 shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out'
          )}
        >
          <DialogPrimitive.Title className="text-lg font-semibold">Delete expense?</DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 text-sm text-muted-foreground">
            This action is soft-delete and hides the record from active lists.
          </DialogPrimitive.Description>

          {expense ? (
            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
              <p className="font-medium">{note}</p>
              <p className="text-sm text-muted-foreground">
                {amount} • {new Date(expense.date).toLocaleDateString()}
              </p>
            </div>
          ) : null}

          {errorMessage ? (
            <Alert variant="destructive" className="mt-4">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>Delete failed</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void onConfirm()} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
