'use client';

import { useMemo, useState } from 'react';
import { Plus, RefreshCw, Pause, Play, Edit2, Trash2, Loader2, Calendar, Bell } from 'lucide-react';
import { format, isBefore, isSameDay, startOfDay } from 'date-fns';
import { RecurringExpense, RecurringFrequency } from '@/types';
import { RecurringExpenseModal } from '@/components/RecurringExpenseModal';
import {
  useRecurringExpenses,
  useDeleteRecurringExpense,
  useToggleRecurringExpense,
  useCategories,
} from '@/hooks/useData';
import { EmptyState } from '@/components/state/EmptyState';
import { currencyFormat } from '@/lib/billSplit';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
    () => recurringExpenses.filter((item) => item.is_active),
    [recurringExpenses]
  );

  const pausedRecurring = useMemo(
    () => recurringExpenses.filter((item) => !item.is_active),
    [recurringExpenses]
  );

  const upcomingDue = useMemo(() => {
    const today = startOfDay(new Date());
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

    return recurringExpenses
      .filter((item) => {
        if (!item.is_active) return false;
        const dueDate = startOfDay(new Date(item.next_due_date));
        return isBefore(dueDate, next7Days) || isSameDay(dueDate, today);
      })
      .sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime());
  }, [recurringExpenses]);

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

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);
    return category?.color || 'hsl(var(--muted-foreground))';
  };

  const isOverdue = (item: RecurringExpense) => {
    return isBefore(startOfDay(new Date(item.next_due_date)), startOfDay(new Date())) && item.is_active;
  };

  const renderRecurringItem = (item: RecurringExpense) => {
    const overdue = isOverdue(item);

    return (
      <div
        key={item.id}
        className={`p-4 sm:p-6 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors group ${
          overdue ? 'bg-destructive/5' : ''
        }`}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getCategoryColor(item.category_id) }}
              />
              <h4 className="font-semibold truncate">{getCategoryName(item.category_id)}</h4>
              <Badge variant="outline">{frequencyLabels[item.frequency]}</Badge>
              {!item.is_active ? <Badge variant="secondary">Paused</Badge> : null}
              {overdue ? (
                <Badge variant="outline" className="border-destructive/40 text-destructive">
                  Overdue
                </Badge>
              ) : null}
            </div>

            <p className="text-2xl font-bold">{currencyFormat(item.amount, item.currency || 'USD')}</p>

            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {overdue ? 'Was due: ' : 'Next: '}
                {format(new Date(item.next_due_date), 'MMM d, yyyy')}
              </span>
              {item.notification_enabled ? (
                <span className="flex items-center gap-1">
                  <Bell size={14} />
                  {item.notification_days_before === 0
                    ? 'Day of'
                    : `${item.notification_days_before} day${
                        item.notification_days_before > 1 ? 's' : ''
                      } before`}
                </span>
              ) : null}
            </div>

            {item.notes ? (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.notes}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToggle(item)}
              disabled={isToggling}
              className="h-8 w-8"
              title={item.is_active ? 'Pause' : 'Activate'}
            >
              {isToggling ? (
                <Loader2 size={16} className="animate-spin" />
              ) : item.is_active ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(item)}
              className="h-8 w-8"
              title="Edit"
            >
              <Edit2 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(item.id)}
              disabled={deletingId === item.id}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Delete"
            >
              {deletingId === item.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </Button>
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
          <p className="text-muted-foreground">Manage your subscriptions and bills.</p>
        </div>
        <Button onClick={handleOpenCreate} className="whitespace-nowrap">
          <Plus size={18} />
          Add Recurring
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl">{activeRecurring.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Paused</CardDescription>
            <CardTitle className="text-2xl">{pausedRecurring.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Due This Week</CardDescription>
            <CardTitle className="text-2xl">{upcomingDue.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {upcomingDue.length > 0 ? (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <div className="space-y-3">
            <div>
              <AlertTitle className="flex items-center gap-2">
                <Bell size={16} />
                Due Soon
              </AlertTitle>
              <AlertDescription>Upcoming recurring expenses in the next 7 days.</AlertDescription>
            </div>
            <div className="space-y-2">
              {upcomingDue.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getCategoryColor(item.category_id) }}
                    />
                    <span className="font-medium">{getCategoryName(item.category_id)}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">
                      {currencyFormat(item.amount, item.currency || 'USD')}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {format(new Date(item.next_due_date), 'MMM d')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Alert>
      ) : null}

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">All Recurring Expenses</CardTitle>
          <CardDescription>{recurringExpenses.length} entries</CardDescription>
        </CardHeader>
        {isLoading ? (
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`recurring-skeleton-${index}`} className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </CardContent>
        ) : recurringExpenses.length === 0 ? (
          <CardContent>
            <EmptyState
              title="No recurring expenses"
              description="Add your subscriptions and bills to track and manage them."
              actionLabel="Add Recurring Expense"
              onAction={handleOpenCreate}
            />
          </CardContent>
        ) : (
          <div>
            {activeRecurring.length > 0 ? (
              <>
                <div className="px-4 sm:px-6 py-3 bg-muted/40 border-y border-border">
                  <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                    <RefreshCw size={14} />
                    Active
                    <Badge variant="secondary">{activeRecurring.length}</Badge>
                  </h3>
                </div>
                {activeRecurring.map(renderRecurringItem)}
              </>
            ) : null}
            {pausedRecurring.length > 0 ? (
              <>
                <div className="px-4 sm:px-6 py-3 bg-muted/40 border-y border-border">
                  <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Pause size={14} />
                    Paused
                    <Badge variant="secondary">{pausedRecurring.length}</Badge>
                  </h3>
                </div>
                {pausedRecurring.map(renderRecurringItem)}
              </>
            ) : null}
          </div>
        )}
      </Card>

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
