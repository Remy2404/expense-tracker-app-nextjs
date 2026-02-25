'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plus, Target, Edit2, Trash2, Loader2, ArrowLeft, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Goal } from '@/types/goals';
import { GoalModal } from '@/components/GoalModal';
import { GoalTransactionModal } from '@/components/GoalTransactionModal';
import { useGoals, useDeleteGoal, useEditGoal, useUpdateGoalBalance, useGoalTransactions, useAddGoalTransaction } from '@/hooks/useData';
import { currencyFormat } from '@/lib/billSplit';
import { format, isBefore, startOfDay } from 'date-fns';

export default function GoalDetailPage() {
  const params = useParams();
  const goalId = params?.id as string;

  const { goals, isLoading, isError } = useGoals();
  const { trigger: deleteGoal, isMutating: isDeleting } = useDeleteGoal();
  const { trigger: editGoal, isMutating: isEditing } = useEditGoal();
  const { trigger: updateBalance, isMutating: isUpdating } = useUpdateGoalBalance();
  const { trigger: addTransaction, isMutating: isAddingTransaction } = useAddGoalTransaction();
  const { transactions, isLoading: isLoadingTransactions } = useGoalTransactions(goalId);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const goal = useMemo(() => goals.find(g => g.id === goalId), [goals, goalId]);

  const isSaving = isEditing || isUpdating || isAddingTransaction;

  const progress = useMemo(() => {
    if (!goal || goal.target_amount <= 0) return 0;
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  }, [goal]);

  const isAchieved = useMemo(() => {
    return goal ? goal.current_amount >= goal.target_amount : false;
  }, [goal]);

  const isOverdue = useMemo(() => {
    if (!goal) return false;
    return isBefore(startOfDay(new Date(goal.deadline)), startOfDay(new Date()));
  }, [goal]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      setDeletingId(goalId);
      await deleteGoal({ id: goalId });
      window.location.href = '/goals';
    } catch (error) {
      console.error('Failed to delete goal', error);
      alert('Failed to delete goal.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTransaction = async (amount: number, type: 'deposit' | 'withdraw', note?: string) => {
    if (!goal) return;

    try {
      // Calculate new balance
      let newAmount = goal.current_amount;
      if (type === 'deposit') {
        newAmount += amount;
      } else {
        newAmount = Math.max(0, newAmount - amount);
      }

      // Save the transaction record to database
      await addTransaction({
        goal_id: goalId,
        amount,
        type,
        date: new Date().toISOString(),
        note,
      });

      // Update goal balance
      await updateBalance({
        id: goalId,
        current_amount: newAmount,
      });

      setIsTransactionModalOpen(false);
    } catch (error) {
      console.error('Failed to process transaction', error);
      alert('Failed to process transaction.');
    }
  };

  const handleEditSubmit = async (data: {
    name: string;
    target_amount: number;
    current_amount: number;
    deadline: string;
    color: string;
    icon: string;
    is_archived?: boolean;
  }) => {
    try {
      const payload = {
        ...data,
        deadline: new Date(data.deadline).toISOString(),
      };
      await editGoal({ id: goalId, ...payload });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update goal', error);
      alert('Failed to update goal.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="space-y-6">
        <Link href="/goals" className="flex items-center gap-2 text-foreground/60 hover:text-foreground">
          <ArrowLeft size={20} />
          Back to Goals
        </Link>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Goal not found</h2>
          <p className="text-foreground/60 mt-2">This goal may have been deleted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/goals" className="flex items-center gap-2 text-foreground/60 hover:text-foreground">
        <ArrowLeft size={20} />
        Back to Goals
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${goal.color}20` }}
          >
            <Target size={32} style={{ color: goal.color }} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              {goal.name}
              {goal.is_archived && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/70">
                  Archived
                </span>
              )}
              {isAchieved && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  Achieved!
                </span>
              )}
            </h1>
            <p className="text-foreground/60">
              Deadline: {format(new Date(goal.deadline), 'MMMM d, yyyy')}
              {isOverdue && !isAchieved && (
                <span className="text-red-500 ml-2">(Overdue)</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <Edit2 size={18} />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deletingId === goalId}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deletingId === goalId ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            Delete
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-sm text-foreground/60">Current</p>
            <p className="text-3xl font-bold">{currencyFormat(goal.current_amount, 'USD')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-foreground/60">Target</p>
            <p className="text-2xl font-semibold">{currencyFormat(goal.target_amount, 'USD')}</p>
          </div>
        </div>

        <div className="relative mb-2">
          <div className="w-full bg-border rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                isAchieved ? 'bg-green-500' : progress >= 75 ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-sm text-foreground/60">
          <span>{progress.toFixed(0)}% complete</span>
          <span>{currencyFormat(goal.target_amount - goal.current_amount, 'USD')} remaining</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setIsTransactionModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Add Money
        </button>
        <button
          onClick={() => setIsTransactionModalOpen(true)}
          className="flex items-center justify-center gap-2 border border-border px-4 py-3 rounded-xl font-medium hover:bg-muted transition-colors"
        >
          <Wallet size={20} />
          Withdraw
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        {isLoadingTransactions ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-foreground/60 text-center py-4">
            No transactions yet. Add or withdraw money to see activity.
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.type === 'deposit' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400'
                  }`}>
                    {tx.type === 'deposit' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div>
                    <p className="font-medium capitalize">{tx.type}</p>
                    <p className="text-sm text-foreground/60">
                      {tx.note || (tx.type === 'deposit' ? 'Deposit' : 'Withdrawal')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${tx.type === 'deposit' ? 'text-green-600' : 'text-amber-600'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}{currencyFormat(tx.amount, 'USD')}
                  </p>
                  <p className="text-sm text-foreground/60">
                    {format(new Date(tx.date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <GoalModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        isSaving={isSaving}
        goalToEdit={goal}
      />

      <GoalTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSubmit={handleTransaction}
        isSaving={isSaving}
        currentBalance={goal.current_amount}
      />
    </div>
  );
}
