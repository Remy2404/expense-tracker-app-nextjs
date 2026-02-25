'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { RecurringExpense, RecurringFrequency, Category } from '@/types';
import { useAddRecurringExpense, useEditRecurringExpense } from '@/hooks/useData';

interface RecurringExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: RecurringExpense | null;
  categories: Category[];
}

const frequencyOptions: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const notificationDaysOptions = [
  { value: 0, label: 'Same day' },
  { value: 1, label: '1 day before' },
  { value: 2, label: '2 days before' },
  { value: 3, label: '3 days before' },
  { value: 7, label: '1 week before' },
];

export function RecurringExpenseModal({ isOpen, onClose, editingItem, categories }: RecurringExpenseModalProps) {
  const { trigger: addRecurring, isMutating: isAdding } = useAddRecurringExpense();
  const { trigger: editRecurring, isMutating: isEditing } = useEditRecurringExpense();

  const isSaving = isAdding || isEditing;

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [notificationDaysBefore, setNotificationDaysBefore] = useState(1);

  useEffect(() => {
    if (editingItem) {
      setAmount(editingItem.amount.toString());
      setCategoryId(editingItem.category_id);
      setFrequency(editingItem.frequency);
      setStartDate(new Date(editingItem.start_date).toISOString().split('T')[0]);
      setEndDate(editingItem.end_date ? new Date(editingItem.end_date).toISOString().split('T')[0] : '');
      setNotes(editingItem.notes || '');
      setNotificationEnabled(editingItem.notification_enabled);
      setNotificationDaysBefore(editingItem.notification_days_before);
    } else {
      setAmount('');
      setCategoryId(categories[0]?.id || '');
      setFrequency('monthly');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setNotes('');
      setNotificationEnabled(true);
      setNotificationDaysBefore(1);
    }
  }, [editingItem, categories, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !categoryId || !startDate) {
      alert('Please fill in all required fields');
      return;
    }

    const payload = {
      amount: parseFloat(amount),
      category_id: categoryId,
      frequency,
      start_date: new Date(startDate).toISOString(),
      end_date: endDate ? new Date(endDate).toISOString() : undefined,
      notes: notes || undefined,
      notification_enabled: notificationEnabled,
      notification_days_before: notificationDaysBefore,
      next_due_date: new Date(startDate).toISOString(),
      is_active: true,
    };

    try {
      if (editingItem) {
        await editRecurring({ id: editingItem.id, ...payload });
      } else {
        await addRecurring(payload);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save recurring expense', error);
      alert(editingItem ? 'Failed to update recurring expense.' : 'Failed to create recurring expense.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-lg bg-background border border-border rounded-xl shadow-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold">
          {editingItem ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Amount *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent"
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Frequency *</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent"
              required
            >
              {frequencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-transparent resize-none"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Reminders</label>
              <button
                type="button"
                onClick={() => setNotificationEnabled(!notificationEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {notificationEnabled && (
              <div>
                <label className="text-sm font-medium">Remind me</label>
                <select
                  value={notificationDaysBefore}
                  onChange={(e) => setNotificationDaysBefore(parseInt(e.target.value))}
                  className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent"
                >
                  {notificationDaysOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              {editingItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
