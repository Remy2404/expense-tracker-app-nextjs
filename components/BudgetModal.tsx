'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Budget } from '@/types';
import { useAddBudget, useEditBudget } from '@/hooks/useData';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBudget: Budget | null;
}

export function BudgetModal({ isOpen, onClose, editingBudget }: BudgetModalProps) {
  const { trigger: addBudget, isMutating: isAdding } = useAddBudget();
  const { trigger: editBudget, isMutating: isEditing } = useEditBudget();

  const isSaving = isAdding || isEditing;

  const [month, setMonth] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  useEffect(() => {
    if (editingBudget) {
      setMonth(editingBudget.month);
      setTotalAmount(editingBudget.total_amount.toString());
    } else {
      // Default to current month
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setMonth(currentMonth);
      setTotalAmount('');
    }
  }, [editingBudget, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!month || !totalAmount) {
      alert('Please fill in all required fields');
      return;
    }

    const payload = {
      month,
      total_amount: parseFloat(totalAmount),
    };

    try {
      if (editingBudget) {
        await editBudget({ id: editingBudget.id, ...payload });
      } else {
        await addBudget(payload);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save budget', error);
      alert(editingBudget ? 'Failed to update budget.' : 'Failed to create budget.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-lg bg-background border border-border rounded-xl shadow-lg p-6 space-y-4">
        <h3 className="text-xl font-semibold">
          {editingBudget ? 'Edit Budget' : 'Create Budget'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Month *</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Budget Amount *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent"
              required
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
              {editingBudget ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
