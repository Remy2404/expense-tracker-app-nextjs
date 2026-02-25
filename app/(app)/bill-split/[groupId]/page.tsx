'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, Plus, Users } from 'lucide-react';
import { useAddBillSplitExpense, useBillSplitGroupDetails, useSettleBillSplitShare } from '@/hooks/useBillSplitData';
import { computeParticipantBalances, currencyFormat } from '@/lib/billSplit';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const expenseSchema = yup
  .object({
    title: yup.string().trim().required('Title is required').max(100),
    amount: yup.number().typeError('Amount must be number').positive().required(),
    date: yup.string().required('Date is required'),
    payerParticipantId: yup.string().required('Payer is required'),
  })
  .required();

type ExpenseFormData = yup.InferType<typeof expenseSchema>;

export default function BillSplitGroupDetailPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params?.groupId;

  const { details, isLoading, error } = useBillSplitGroupDetails(groupId);
  const { trigger: addExpense, isMutating: isAddingExpense } = useAddBillSplitExpense(groupId || '');
  const { trigger: settleShare, isMutating: isSettling } = useSettleBillSplitShare(groupId || '');

  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: yupResolver(expenseSchema),
    defaultValues: {
      title: '',
      amount: undefined,
      date: new Date().toISOString().split('T')[0],
      payerParticipantId: '',
    },
  });

  const balances = useMemo(() => {
    if (!details) return [];
    return computeParticipantBalances(details.participants, details.expenses, details.shares);
  }, [details]);

  const onCreateExpense = async (data: ExpenseFormData) => {
    if (!details?.participants.length) return;
    try {
      await addExpense({
        title: data.title,
        amount: Number(data.amount),
        currency: details.group.currency,
        date: new Date(data.date).toISOString(),
        splitType: 'equal',
        payerParticipantId: data.payerParticipantId,
        participantIds: details.participants.map((participant) => participant.id),
      });
      reset();
      setShowExpenseModal(false);
    } catch (submitError) {
      console.error(submitError);
      alert('Failed to add expense. Please verify bill split tables and RLS permissions.');
    }
  };

  const onSettleShare = async (payload: {
    shareId: string;
    expenseId: string;
    participantId: string;
    amount: number;
  }) => {
    try {
      await settleShare({ ...payload, method: 'manual-web', note: 'Settled from web bill split module' });
    } catch (settleError) {
      console.error(settleError);
      alert('Failed to settle share.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="p-8 border border-border rounded-xl bg-card text-center space-y-2">
        <AlertCircle className="mx-auto text-destructive" />
        <p className="font-medium">Could not load this group.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{details.group.name}</h1>
          <p className="text-foreground/60">{details.participants.length} participants • {details.expenses.length} expenses</p>
        </div>
        <button
          onClick={() => setShowExpenseModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium"
        >
          <Plus size={16} /> Add Expense
        </button>
      </div>

      <section className="border border-border rounded-xl bg-card p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Member balances</h2>
        {balances.length === 0 ? (
          <p className="text-foreground/60">No participants yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {balances.map((item) => (
              <div key={item.participantId} className="border border-border rounded-lg p-3">
                <p className="font-medium">{item.participantName}</p>
                <p className={`text-sm mt-1 ${item.balance > 0 ? 'text-green-600' : item.balance < 0 ? 'text-orange-600' : 'text-foreground/60'}`}>
                  {item.balance > 0
                    ? `Gets back ${currencyFormat(item.balance, details.group.currency)}`
                    : item.balance < 0
                      ? `Owes ${currencyFormat(Math.abs(item.balance), details.group.currency)}`
                      : 'Settled'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Split expenses</h2>
          <Users size={18} className="text-foreground/50" />
        </div>

        {details.expenses.length === 0 ? (
          <div className="p-10 text-center text-foreground/60">No split expenses yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {details.expenses.map((expense) => {
              const payer = details.participants.find((participant) => participant.id === expense.payer_participant_id);
              const shares = details.shares.filter((share) => share.expense_id === expense.id);

              return (
                <div key={expense.id} className="p-4 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{expense.title}</p>
                      <p className="text-sm text-foreground/60">
                        Paid by {payer?.name ?? 'Unknown'} • {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-semibold">{currencyFormat(expense.amount, expense.currency)}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {shares.map((share) => {
                      const participant = details.participants.find((item) => item.id === share.participant_id);
                      return (
                        <div key={share.id} className="border border-border rounded-lg p-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{participant?.name ?? 'Participant'}</p>
                            <p className="text-xs text-foreground/60">{currencyFormat(share.amount, expense.currency)}</p>
                          </div>
                          {share.is_settled ? (
                            <span className="text-green-600 text-xs flex items-center gap-1">
                              <CheckCircle2 size={14} /> Settled
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                onSettleShare({
                                  shareId: share.id,
                                  expenseId: expense.id,
                                  participantId: share.participant_id,
                                  amount: share.amount,
                                })
                              }
                              disabled={isSettling}
                              className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-foreground/5 disabled:opacity-50"
                            >
                              Mark settled
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center">
          <form
            onSubmit={handleSubmit(onCreateExpense)}
            className="w-full max-w-lg bg-background border border-border rounded-xl shadow-lg p-6 space-y-4"
          >
            <h3 className="text-xl font-semibold">Add Split Expense</h3>

            <div>
              <label className="text-sm font-medium">Title</label>
              <input {...register('title')} className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent" />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Amount</label>
                <input type="number" step="0.01" {...register('amount')} className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent" />
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <input type="date" {...register('date')} className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent" />
                {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Who paid?</label>
              <select {...register('payerParticipantId')} className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-background">
                <option value="">Select payer</option>
                {details.participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name}
                  </option>
                ))}
              </select>
              {errors.payerParticipantId && <p className="text-xs text-red-500 mt-1">{errors.payerParticipantId.message}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 border border-border rounded-lg">
                Cancel
              </button>
              <button type="submit" disabled={isAddingExpense} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 flex items-center gap-2">
                {isAddingExpense ? <Loader2 size={16} className="animate-spin" /> : null}
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
