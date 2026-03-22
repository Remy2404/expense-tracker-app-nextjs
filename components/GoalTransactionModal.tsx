'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import type { GoalTransactionType } from '@/lib/goals';

interface GoalTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, type: GoalTransactionType, note?: string) => Promise<void>;
  isSaving: boolean;
  currentBalance: number;
  defaultType: GoalTransactionType;
}

export function GoalTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  isSaving,
  currentBalance,
  defaultType,
}: GoalTransactionModalProps) {
  const [type, setType] = useState<GoalTransactionType>(defaultType);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setType(defaultType);
    setAmount('');
    setNote('');
  }, [defaultType, isOpen]);

  const titleId = 'goal-transaction-modal-title';
  const amountInputId = 'goal-transaction-amount';
  const noteInputId = 'goal-transaction-note';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (type === 'withdraw' && parseFloat(amount) > currentBalance) {
      alert('Cannot withdraw more than current balance');
      return;
    }

    await onSubmit(parseFloat(amount), type, note || undefined);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg bg-background border border-border rounded-xl shadow-lg p-6 space-y-4"
      >
        <h3 id={titleId} className="text-xl font-semibold">
          {type === 'deposit' ? 'Add Money to Goal' : 'Withdraw from Goal'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('deposit')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                type === 'deposit'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-muted text-foreground/60 hover:text-foreground'
              }`}
            >
              <TrendingUp size={18} />
              Deposit
            </button>
            <button
              type="button"
              onClick={() => setType('withdraw')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                type === 'withdraw'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                  : 'bg-muted text-foreground/60 hover:text-foreground'
              }`}
            >
              <TrendingDown size={18} />
              Withdraw
            </button>
          </div>

          <div>
            <label htmlFor={amountInputId} className="text-sm font-medium">Amount *</label>
            <input
              id={amountInputId}
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent"
              required
            />
            {type === 'withdraw' && (
              <p className="text-xs text-foreground/60 mt-1">
                Available: ${currentBalance.toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={noteInputId} className="text-sm font-medium">Note (optional)</label>
            <input
              id={noteInputId}
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {type === 'deposit' ? 'Add Money' : 'Withdraw'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
