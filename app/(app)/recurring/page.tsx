'use client';

import { useState, useMemo } from 'react';
import { Plus, RefreshCw, Pause, Play, Edit2, Trash2, Loader2, Calendar, Bell } from 'lucide-react';
import { RecurringExpense, RecurringFrequency } from '@/types';
import { RecurringExpenseModal } from '@/components/RecurringExpenseModal';
import { useRecurringExpenses, useDeleteRecurringExpense, useToggleRecurringExpense, useCategories } from '@/hooks/useData';
import { currencyFormat } from '@/lib/utils';
import { format, isBefore, startOfDay, isSameDay } from 'date-fns';

const frequencyLabels: Record<RecurringFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export default function RecurringExpensesPage() {
  const { recurringExpenses, isLoading } = useRecurringExpenses();
  const { categories } = useCategories();
  const { trigger: deleteRecurring } = useDeleteRecurringExpense();
  const { trigger: toggleRecurring, isMutating: isToggling } = useToggleRecurringExpense();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringExpense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeRecurring = useMemo(
    () => recurringExpenses.filter((r) => r.is_active),
    [recurringExpenses]
  );

  const pausedRecurring = useMemo(
    () => recurringExpenses.filter((r) => !r.is_active),
    [recurringExpenses]
  );

  const upcomingDue = useMemo(() => {
    const today = startOfDay(new Date());
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

    return recurringExpenses
      .filter((r) => {
        if (!r.is_active) return false;
        const dueDate = startOfDay(new Date(r.next_due_date));
        return isBefore(dueDate, next7Days) || isSameDay(dueDate, today);
      })
      .sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime());
  }, [recurringExpenses]);

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || 'Unknown';
  };

  const getCategoryColor = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.color || '#888';
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: RecurringExpense) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recurring expense?')) return;
    try {
      setDeletingId(id);
      await deleteRecurring({ id });
    } catch (error) {
      console.error('Failed to delete recurring expense', error);
      alert('Failed to delete recurring expense.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (item: RecurringExpense) => {
    try {
      await toggleRecurring({ id: item.id, isActive: !item.is_active });
    } catch (error) {
      console.error('Failed to toggle recurring expense', error);
      alert('Failed to update recurring expense.');
    }
  };

  const isOverdue = (item: RecurringExpense) => {
    return isBefore(startOfDay(new Date(item.next_due_date)), startOfDay(new Date())) && item.is_active;
  };

  const renderRecurringItem = (item: RecurringExpense) => {
    const isOverdueItem = isOverdue(item);
    return (
      <div
        key={item.id}
        className={`p-4 sm:p-6 border-b border-border hover:bg-foreground/5 transition-colors group ${
          isOverdueItem ? 'bg-red-50 dark:bg-red-950/20' : ''
        }`}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getCategoryColor(item.category_id) }}
              />
              <h4 className="font-semibold truncate">
                {getCategoryName(item.category_id)}
              </h4>
              {!item.is_active && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Paused
                </span>
              )}
              {isOverdueItem && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                  Overdue
                </span>
              )}
            </div>
            <p className="text-2xl font-bold">{currencyFormat(item.amount, item.currency || 'USD')}</p>
            <div className="flex items-center gap-3 mt-2 text-sm text-foreground/60">
              <span className="flex items-center gap-1">
                <RefreshCw size={14} />
                {frequencyLabels[item.frequency]}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {isOverdueItem ? 'Was due: ' : 'Next: '}
                {format(new Date(item.next_due_date), 'MMM d, yyyy')}
              </span>
              {item.notification_enabled && (
                <span className="flex items-center gap-1">
                  <Bell size={14} />
                  {item.notification_days_before === 0
                    ? 'Day of'
                    : `${item.notification_days_before} day${item.notification_days_before > 1 ? 's' : ''} before`}
                </span>
              )}
            </div>
            {item.notes && (
              <p className="text-sm text-foreground/60 mt-2 line-clamp-2">{item.notes}</p>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleToggle(item)}
              disabled={isToggling}
              className="p-2 text-foreground/60 hover:text-primary hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50"
              title={item.is_active ? 'Pause' : 'Activate'}
            >
              {isToggling ? (
                <Loader2 size={16} className="animate-spin" />
              ) : item.is_active ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )}
            </button>
            <button
              onClick={() => handleEdit(item)}
              className="p-2 text-foreground/60 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
              title="Edit"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              disabled={deletingId === item.id}
              className="p-2 text-foreground/60 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
              title="Delete"
            >
              {deletingId === item.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Recurring Expenses</h1>
          <p className="text-foreground/60">Manage your subscriptions and bills.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <Plus size={18} />
          Add Recurring
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-border rounded-xl p-4 bg-card">
          <p className="text-sm text-foreground/60">Active</p>
          <p className="text-2xl font-bold mt-1">{activeRecurring.length}</p>
        </div>
        <div className="border border-border rounded-xl p-4 bg-card">
          <p className="text-sm text-foreground/60">Paused</p>
          <p className="text-2xl font-bold mt-1">{pausedRecurring.length}</p>
        </div>
        <div className="border border-border rounded-xl p-4 bg-card">
          <p className="text-sm text-foreground/60">Due This Week</p>
          <p className="text-2xl font-bold mt-1">{upcomingDue.length}</p>
        </div>
      </div>

      {/* Upcoming Due */}
      {upcomingDue.length > 0 && (
        <div className="border border-border rounded-xl bg-amber-50 dark:bg-amber-950/20 overflow-hidden">
          <div className="p-4 border-b border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <Bell size={16} />
              Due Soon
            </h3>
          </div>
          <div className="divide-y divide-amber-200 dark:divide-amber-800">
            {upcomingDue.slice(0, 3).map((item) => (
              <div key={item.id} className="p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getCategoryColor(item.category_id) }}
                  />
                  <span className="font-medium">{getCategoryName(item.category_id)}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{currencyFormat(item.amount, item.currency || 'USD')}</span>
                  <span className="text-sm text-foreground/60 ml-2">
                    {format(new Date(item.next_due_date), 'MMM d')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : recurringExpenses.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mb-4 text-foreground/40">
              <RefreshCw size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-2">No recurring expenses</h3>
            <p className="text-foreground/60 max-w-sm mb-6">
              Add your subscriptions and bills to track and manage them.
            </p>
            <button
              onClick={handleOpenCreate}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Add Recurring Expense
            </button>
          </div>
        ) : (
          <div>
            {activeRecurring.length > 0 && (
              <>
                <div className="px-4 sm:px-6 py-3 bg-muted/50 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider">
                    Active ({activeRecurring.length})
                  </h3>
                </div>
                {activeRecurring.map(renderRecurringItem)}
              </>
            )}
            {pausedRecurring.length > 0 && (
              <>
                <div className="px-4 sm:px-6 py-3 bg-muted/50 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider">
                    Paused ({pausedRecurring.length})
                  </h3>
                </div>
                {pausedRecurring.map(renderRecurringItem)}
              </>
            )}
          </div>
        )}
      </div>

      <RecurringExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
        categories={categories}
      />
    </div>
  );
}
