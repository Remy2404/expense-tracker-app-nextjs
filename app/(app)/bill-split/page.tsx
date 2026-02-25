'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Loader2, Plus, Users, Receipt, AlertCircle } from 'lucide-react';
import { useCreateBillSplitGroup, useBillSplitGroups } from '@/hooks/useBillSplitData';
import { currencyFormat } from '@/lib/billSplit';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const groupSchema = yup
  .object({
    name: yup.string().trim().required('Group name is required').max(80),
    currency: yup.string().trim().required('Currency is required').length(3),
    participants: yup.string().trim().required('Add at least one participant'),
  })
  .required();

type GroupFormData = yup.InferType<typeof groupSchema>;

export default function BillSplitPage() {
  const { groups, isLoading, error } = useBillSplitGroups();
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
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          New Group
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-border rounded-xl p-4 bg-card">
          <p className="text-sm text-foreground/60">Active Groups</p>
          <p className="text-2xl font-bold mt-1">{groups.length}</p>
        </div>
        <div className="border border-border rounded-xl p-4 bg-card">
          <p className="text-sm text-foreground/60">Total Split Expenses</p>
          <p className="text-2xl font-bold mt-1">{currencyFormat(totalOutstanding, 'USD')}</p>
        </div>
        <div className="border border-border rounded-xl p-4 bg-card">
          <p className="text-sm text-foreground/60">Unsettled Shares</p>
          <p className="text-2xl font-bold mt-1">{groups.reduce((sum, group) => sum + group.unsettledSharesCount, 0)}</p>
        </div>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-2">
            <AlertCircle className="mx-auto text-destructive" />
            <p className="font-medium">Could not load bill split groups.</p>
            <p className="text-sm text-foreground/60">
              Check your Supabase schema for bill_split_* tables and Row Level Security rules.
            </p>
          </div>
        ) : groups.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="mx-auto text-foreground/40" />
            <h3 className="text-lg font-semibold">No groups yet</h3>
            <p className="text-foreground/60">Create your first split group to start tracking shared expenses.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {groups.map((group) => (
              <Link key={group.id} href={`/bill-split/${group.id}`} className="block p-4 sm:p-6 hover:bg-foreground/5 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{group.name}</h3>
                    <p className="text-sm text-foreground/60 mt-1">
                      {group.participantsCount} participants • {group.expensesCount} expenses • {group.unsettledSharesCount} unsettled
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{currencyFormat(group.totalExpenses, group.currency)}</p>
                    <p className="text-xs text-foreground/60 flex items-center gap-1 justify-end mt-1">
                      <Receipt size={12} /> Total spent
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center">
          <form
            onSubmit={handleSubmit(onCreateGroup)}
            className="w-full max-w-lg bg-background border border-border rounded-xl shadow-lg p-6 space-y-4"
          >
            <h3 className="text-xl font-semibold">Create Split Group</h3>

            <div>
              <label className="text-sm font-medium">Group Name</label>
              <input {...register('name')} className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Currency (ISO)</label>
                <input
                  {...register('currency')}
                  maxLength={3}
                  className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent uppercase"
                />
                {errors.currency && <p className="text-xs text-red-500 mt-1">{errors.currency.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Participants</label>
                <input
                  {...register('participants')}
                  placeholder="You, Alice, Bob"
                  className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent"
                />
                {errors.participants && <p className="text-xs text-red-500 mt-1">{errors.participants.message}</p>}
              </div>
            </div>

            <p className="text-xs text-foreground/60">Tip: participants are comma-separated. Include &quot;You&quot; for current user tracking.</p>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border border-border rounded-lg">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isMutating}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 disabled:opacity-50"
              >
                {isMutating ? <Loader2 size={16} className="animate-spin" /> : null}
                Create Group
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
