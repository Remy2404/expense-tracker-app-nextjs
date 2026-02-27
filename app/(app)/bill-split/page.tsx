'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Loader2, Plus, Receipt } from 'lucide-react';
import { useCreateBillSplitGroup, useBillSplitGroups } from '@/hooks/useBillSplitData';
import { currencyFormat } from '@/lib/billSplit';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { EmptyState } from '@/components/state/EmptyState';
import { ErrorState } from '@/components/state/ErrorState';
import { PageSkeleton } from '@/components/state/PageSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

const groupSchema = yup
  .object({
    name: yup.string().trim().required('Group name is required').max(80),
    currency: yup.string().trim().required('Currency is required').length(3),
    participants: yup.string().trim().required('Add at least one participant'),
  })
  .required();

type GroupFormData = yup.InferType<typeof groupSchema>;

export default function BillSplitPage() {
  const { groups, isLoading, error, mutate } = useBillSplitGroups();
  const { trigger: createGroup, isMutating } = useCreateBillSplitGroup();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GroupFormData>({
    resolver: yupResolver(groupSchema),
    defaultValues: {
      name: '',
      currency: 'USD',
      participants: 'You',
    },
  });

  const totalOutstanding = useMemo(
    () => groups.reduce((sum, group) => sum + group.totalExpenses, 0),
    [groups]
  );

  const onCreateGroup = async (data: GroupFormData) => {
    const participantNames = data.participants
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      await createGroup({
        name: data.name,
        currency: data.currency.toUpperCase(),
        participantNames,
      });
      reset();
      setOpen(false);
    } catch (createError: unknown) {
      console.error('Create group error:', createError);
      const errorMessage = createError && typeof createError === 'object' && 'message' in createError
        ? String((createError as { message: unknown }).message)
        : 'Unknown error';
      alert(`Failed to create group: ${errorMessage}. Please check console for details.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bill Split</h1>
          <p className="text-foreground/60">Create groups, split expenses, and track settlements.</p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <Plus size={16} />
          New Group
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription>Active Groups</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{groups.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription>Total Split Expenses</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{currencyFormat(totalOutstanding, 'USD')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription>Unsettled Shares</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">
              {groups.reduce((sum, group) => sum + group.unsettledSharesCount, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <CardContent className="p-6">
            <PageSkeleton cards={2} rows={4} />
          </CardContent>
        ) : error ? (
          <CardContent className="p-6">
            <ErrorState
              title="Could not load bill split groups."
              description="Check bill_split_* tables and Row Level Security rules."
              onRetry={() => void mutate()}
            />
          </CardContent>
        ) : groups.length === 0 ? (
          <CardContent className="p-6">
            <EmptyState
              title="No groups yet"
              description="Create your first split group to start tracking shared expenses."
              actionLabel="Create Group"
              onAction={() => setOpen(true)}
            />
          </CardContent>
        ) : (
          <div className="divide-y divide-border">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/bill-split/${group.id}`}
                className="block p-4 sm:p-6 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{group.name}</h3>
                    <p className="text-sm text-foreground/60 mt-1">
                      {group.participantsCount} participants • {group.expensesCount} expenses • {group.unsettledSharesCount} unsettled
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{currencyFormat(group.totalExpenses, group.currency)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                      <Receipt size={12} /> Total spent
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={handleSubmit(onCreateGroup)}
            className="w-full max-w-lg bg-background border border-border rounded-xl shadow-lg p-6 space-y-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-group-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="create-group-title" className="text-xl font-semibold">Create Split Group</h3>

            <div>
              <label htmlFor="group-name" className="text-sm font-medium">Group Name</label>
              <input
                id="group-name"
                {...register('name')}
                className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="group-currency" className="text-sm font-medium">Currency (ISO)</label>
                <input
                  id="group-currency"
                  {...register('currency')}
                  maxLength={3}
                  className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent uppercase"
                />
                {errors.currency && <p className="text-xs text-red-500 mt-1">{errors.currency.message}</p>}
              </div>
              <div>
                <label htmlFor="group-participants" className="text-sm font-medium">Participants</label>
                <input
                  id="group-participants"
                  {...register('participants')}
                  placeholder="You, Alice, Bob"
                  className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent"
                />
                {errors.participants && <p className="text-xs text-red-500 mt-1">{errors.participants.message}</p>}
              </div>
            </div>

            <p className="text-xs text-foreground/60">Tip: participants are comma-separated. Include &quot;You&quot; for current user tracking.</p>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isMutating}
                className="gap-2"
              >
                {isMutating ? <Loader2 size={16} className="animate-spin" /> : null}
                Create Group
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
