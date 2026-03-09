import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { useSWRConfig } from 'swr';
import { supabase } from '@/lib/supabase';
import { aiHttpClient } from '@/lib/api/http';
import { financeApi, type FinanceSummaryPeriod, type FinanceSummaryResponse } from '@/lib/api/finance.api';
import {
  syncApi,
  type SyncPushRequest,
  type SyncCategoryItem,
  type SyncExpenseItem,
  type SyncBudgetItem,
  type SyncCategoryBudgetItem,
  type SyncGoalItem,
  type SyncGoalTransactionItem,
  type SyncRecurringItem,
} from '@/lib/api/sync.api';
import { Expense, Category, CategoryType, Budget, RecurringExpense } from '@/types';
import { Goal, GoalTransaction } from '@/types/goals';
import { useAuth } from '@/contexts/AuthContext';
import { MOBILE_DEFAULT_CATEGORIES } from '@/constants/defaultCategories';
import { DEFAULT_TRANSACTION_TYPE, getCategoryType, getTransactionType } from '@/lib/transactions';

type CategoryWriteInput = Partial<Category> & {
  category_type?: string | null;
};

type ExpenseWriteInput = Partial<Expense> & {
  transaction_type?: string | null;
  note_summary?: string | null;
};

type BudgetRecord = Budget & {
  category_budgets?: SyncCategoryBudgetItem[];
};

type RecurringWriteInput = RecurringExpense & {
  retry_count?: number | null;
  last_error?: string | null;
};

const normalizeCategory = (category: CategoryWriteInput): Category => {
  const resolvedType = getCategoryType(category as Pick<Category, 'type' | 'category_type'>);
  return {
    ...category,
    type: resolvedType,
    category_type: resolvedType,
  } as Category;
};

const normalizeExpense = (expense: ExpenseWriteInput): Expense => {
  const resolvedType = getTransactionType(expense as Pick<Expense, 'transaction_type'>);
  return {
    ...expense,
    transaction_type: resolvedType,
  } as Expense;
};

const fetcher = async (table: string) => {
  let url = '';
  switch (table) {
    case 'expenses':
      url = '/api/expenses';
      break;
    case 'categories':
      url = '/api/categories';
      break;
    case 'budgets':
      url = '/api/budgets';
      break;
    case 'savings_goals':
      url = '/api/goals';
      break;
    case 'recurring_expenses':
      url = '/api/recurring-expenses';
      break;
    default:
      throw new Error(`Unknown table: ${table}`);
  }

  const response = await aiHttpClient.get(url);
  const data = response.data;

  if (table === 'categories') {
    return (data || []).map((category: CategoryWriteInput) => normalizeCategory(category));
  }
  if (table === 'expenses') {
    return (data || []).map((expense: ExpenseWriteInput) => normalizeExpense(expense));
  }
  return data || [];
};

const nowIso = () => new Date().toISOString();

const createUuid = (): string => {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (!uuid) {
    throw new Error('crypto.randomUUID is unavailable in this environment.');
  }
  return uuid;
};

const toIsoString = (value: string | Date | null | undefined): string | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const toRequiredIsoString = (value: string | Date | null | undefined, fallback = nowIso()): string => {
  return toIsoString(value) ?? fallback;
};

const createSyncPayload = (): SyncPushRequest => ({
  categories: [],
  expenses: [],
  budgets: [],
  goals: [],
  recurring: [],
});

const pushSyncChange = async (changes: Partial<SyncPushRequest>) => {
  await syncApi.pushChanges({
    ...createSyncPayload(),
    ...changes,
  });
};

const revalidateFinanceSummary = (mutate: ReturnType<typeof useSWRConfig>['mutate']) => {
  void mutate((key: unknown) => Array.isArray(key) && key[0] === 'finance-summary');
};

const fetchSingle = async <T>(table: string, id: string): Promise<T> => {
  let url = '';
  switch (table) {
    case 'expenses':
      url = `/api/expenses/${id}`;
      break;
    case 'categories':
      url = `/api/categories/${id}`;
      break;
    case 'budgets':
      url = `/api/budgets/${id}`;
      break;
    case 'savings_goals':
      url = `/api/goals/${id}`;
      break;
    case 'recurring_expenses':
      url = `/api/recurring-expenses/${id}`;
      break;
    default:
      throw new Error(`Unknown table: ${table}`);
  }
  const response = await aiHttpClient.get(url);
  return response.data;
};

const fetchCategoryBudgetsByBudgetId = async (budgetId: string): Promise<SyncCategoryBudgetItem[]> => {
  const budget = await fetchSingle<any>('budgets', budgetId);
  return budget.category_budgets || [];
};

const fetchGoalTransactionsByGoalId = async (goalId: string): Promise<GoalTransaction[]> => {
  const response = await aiHttpClient.get(`/api/goals/${goalId}/transactions`);
  return response.data || [];
};

const toSyncCategoryItem = (category: CategoryWriteInput): SyncCategoryItem => {
  const createdAt = toRequiredIsoString(category.created_at);
  const updatedAt = toRequiredIsoString(category.updated_at, createdAt);
  return {
    id: category.id || createUuid(),
    name: category.name || 'Category',
    icon: category.icon || 'wallet',
    color: category.color || '#64748b',
    is_default: Boolean(category.is_default),
    category_type: getCategoryType(category as Pick<Category, 'type' | 'category_type'>).toUpperCase() as SyncCategoryItem['category_type'],
    sort_order: category.sort_order ?? null,
    is_deleted: Boolean(category.is_deleted),
    deleted_at: toIsoString(category.deleted_at),
    retry_count: category.retry_count ?? null,
    last_error: category.last_error ?? null,
    created_at: createdAt,
    updated_at: updatedAt,
    synced_at: toIsoString(category.synced_at),
    version: null,
  };
};

const toSyncExpenseItem = (expense: ExpenseWriteInput): SyncExpenseItem => {
  const createdAt = toRequiredIsoString(expense.created_at);
  const updatedAt = toRequiredIsoString(expense.updated_at, createdAt);
  return {
    id: expense.id || createUuid(),
    amount: Number(expense.amount ?? 0),
    transaction_type: getTransactionType({
      transaction_type: (expense.transaction_type ?? DEFAULT_TRANSACTION_TYPE) as Expense['transaction_type'],
    }).toUpperCase() as SyncExpenseItem['transaction_type'],
    category_id: expense.category_id ?? null,
    date: toRequiredIsoString(expense.date),
    notes: expense.notes ?? expense.note ?? null,
    merchant: expense.merchant ?? null,
    note_summary: expense.note_summary ?? null,
    ai_category_id: expense.ai_category_id ?? null,
    ai_confidence: expense.ai_confidence ?? null,
    ai_source: expense.ai_source ?? null,
    ai_last_updated: toIsoString(expense.ai_last_updated),
    recurring_expense_id: expense.recurring_expense_id ?? null,
    receipt_paths: expense.receipt_paths ?? [],
    currency: expense.currency ?? null,
    original_amount: expense.original_amount ?? null,
    exchange_rate: expense.exchange_rate ?? null,
    rate_source: expense.rate_source ?? null,
    created_at: createdAt,
    updated_at: updatedAt,
    synced_at: toIsoString(expense.synced_at),
    is_deleted: Boolean(expense.is_deleted),
    deleted_at: toIsoString(expense.deleted_at),
    retry_count: expense.retry_count ?? null,
    last_error: expense.last_error ?? null,
    version: null,
  };
};

const toSyncBudgetItem = (budget: BudgetRecord, categoryBudgets: SyncCategoryBudgetItem[] = []): SyncBudgetItem => {
  const createdAt = toRequiredIsoString(budget.created_at);
  const updatedAt = toRequiredIsoString(budget.updated_at, createdAt);
  return {
    id: budget.id,
    month: budget.month,
    total_amount: Number(budget.total_amount ?? 0),
    category_budgets: categoryBudgets,
    created_at: createdAt,
    updated_at: updatedAt,
    synced_at: toIsoString(budget.synced_at),
    is_deleted: Boolean(budget.is_deleted),
    deleted_at: toIsoString(budget.deleted_at),
    retry_count: budget.retry_count ?? null,
    last_error: budget.last_error ?? null,
    version: null,
  };
};

const toSyncGoalTransactionItem = (transaction: GoalTransaction): SyncGoalTransactionItem => ({
  id: transaction.id || createUuid(),
  amount: Number(transaction.amount),
  type: transaction.type,
  note: transaction.note ?? null,
  date: toRequiredIsoString(transaction.date),
});

const toSyncGoalItem = (goal: Goal, transactions: GoalTransaction[]): SyncGoalItem => {
  const createdAt = toRequiredIsoString(goal.created_at);
  const updatedAt = toRequiredIsoString(goal.updated_at, createdAt);
  return {
    id: goal.id,
    name: goal.name,
    target_amount: Number(goal.target_amount ?? 0),
    current_amount: Number(goal.current_amount ?? 0),
    deadline: toIsoString(goal.deadline),
    color: goal.color,
    icon: goal.icon,
    is_archived: Boolean(goal.is_archived),
    transactions: transactions.map(toSyncGoalTransactionItem),
    created_at: createdAt,
    updated_at: updatedAt,
    synced_at: toIsoString(goal.synced_at),
    is_deleted: Boolean(goal.is_deleted),
    deleted_at: toIsoString(goal.deleted_at),
    retry_count: goal.retry_count ?? null,
    last_error: goal.last_error ?? null,
    version: null,
  };
};

const toSyncRecurringItem = (recurring: RecurringWriteInput): SyncRecurringItem => {
  const createdAt = toRequiredIsoString(recurring.created_at);
  const updatedAt = toRequiredIsoString(recurring.updated_at, createdAt);
  return {
    id: recurring.id,
    amount: Number(recurring.amount ?? 0),
    category_id: recurring.category_id ?? null,
    notes: recurring.notes ?? null,
    frequency: recurring.frequency,
    currency: recurring.currency ?? null,
    original_amount: recurring.original_amount ?? null,
    exchange_rate: recurring.exchange_rate ?? null,
    start_date: toRequiredIsoString(recurring.start_date),
    end_date: toIsoString(recurring.end_date),
    last_generated: toIsoString(recurring.last_generated),
    next_due_date: toRequiredIsoString(recurring.next_due_date),
    is_active: recurring.is_active,
    notification_enabled: recurring.notification_enabled,
    notification_days_before: recurring.notification_days_before ?? null,
    created_at: createdAt,
    updated_at: updatedAt,
    synced_at: toIsoString(recurring.synced_at),
    is_deleted: Boolean(recurring.is_deleted),
    deleted_at: toIsoString(recurring.deleted_at),
    retry_count: recurring.retry_count ?? null,
    last_error: recurring.last_error ?? null,
    version: null,
  };
};

export function useExpenses() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<Expense[]>(user ? 'expenses' : null, fetcher, {
    revalidateOnFocus: true,
  });

  return {
    expenses: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useFinanceSummary(period: FinanceSummaryPeriod = 'all-time') {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<FinanceSummaryResponse>(
    user ? ['finance-summary', period] : null,
    () => financeApi.getSummary(period),
    { revalidateOnFocus: true },
  );

  return {
    summary: data ?? null,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCategories() {
  const { user } = useAuth();
  const seededRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const { data, error, isLoading, mutate } = useSWR<Category[]>(user ? 'categories' : null, fetcher);

  useEffect(() => {
    if (!user?.uid || isLoading || !data || inFlightRef.current) return;

    const currentKey = `${user.uid}:${data.length}`;
    if (seededRef.current === currentKey) return;

    const existingNames = new Set(data.map((category) => category.name.trim().toLowerCase()));
    const missingDefaults = MOBILE_DEFAULT_CATEGORIES.filter(
      (defaultCategory) => !existingNames.has(defaultCategory.name.trim().toLowerCase())
    );

    if (missingDefaults.length === 0) {
      seededRef.current = currentKey;
      return;
    }

    inFlightRef.current = true;
    const seedDefaults = async () => {
      try {
        const timestamp = nowIso();
        await pushSyncChange({
          categories: missingDefaults.map((category) =>
            toSyncCategoryItem({
              ...category,
              id: createUuid(),
              is_default: category.is_default ?? true,
              created_at: timestamp,
              updated_at: timestamp,
            })
          ),
        });
        await mutate();
      } catch (seedError) {
        console.error('Error seeding default categories:', seedError);
      } finally {
        inFlightRef.current = false;
        seededRef.current = currentKey;
      }
    };

    void seedDefaults();
  }, [user?.uid, data, isLoading, mutate]);

  return {
    categories: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useBudgets() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<Budget[]>(user ? 'budgets' : null, fetcher);
  return {
    budgets: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useAddBudget() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('budgets', async (_key, { arg }: { arg: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'synced_at' | 'is_deleted'> }) => {
    const timestamp = nowIso();
    const budget: BudgetRecord = {
      id: createUuid(),
      ...arg,
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
    };
    await pushSyncChange({ budgets: [toSyncBudgetItem(budget)] });
    await mutate('budgets');
    revalidateFinanceSummary(mutate);
    return budget;
  });
}

export function useEditBudget() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('budgets', async (_key, { arg }: { arg: { id: string } & Partial<Omit<Budget, 'id' | 'created_at' | 'updated_at'>> }) => {
    const existingBudget = await fetchSingle<Budget>('budgets', arg.id);
    const existingCategoryBudgets = await fetchCategoryBudgetsByBudgetId(arg.id);
    const updatedBudget: BudgetRecord = {
      ...existingBudget,
      ...arg,
      updated_at: nowIso(),
    };
    await pushSyncChange({ budgets: [toSyncBudgetItem(updatedBudget, existingCategoryBudgets)] });
    await mutate('budgets');
    revalidateFinanceSummary(mutate);
    return updatedBudget;
  });
}

export function useDeleteBudget() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('budgets', async (_key, { arg }: { arg: { id: string } }) => {
    const existingBudget = await fetchSingle<Budget>('budgets', arg.id);
    const existingCategoryBudgets = await fetchCategoryBudgetsByBudgetId(arg.id);
    const deletedAt = nowIso();
    await pushSyncChange({
      budgets: [
        toSyncBudgetItem(
          {
            ...existingBudget,
            is_deleted: true,
            deleted_at: deletedAt,
            updated_at: deletedAt,
          },
          existingCategoryBudgets
        ),
      ],
    });
    await mutate('budgets');
    revalidateFinanceSummary(mutate);
    return true;
  });
}

export function useGoals() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<Goal[]>(user ? 'savings_goals' : null, fetcher);
  return {
    goals: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useBudgetByMonth(month: string) {
  const fetcherByMonth = async () => {
    if (!month) return null;
    try {
      const response = await aiHttpClient.get(`/api/budgets/month/${month}`);
      return response.data as Budget;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  };

  const { data, error, isLoading, mutate } = useSWR(month ? ['budgets', month] : null, fetcherByMonth);
  return {
    budget: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useAddCategory() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('categories', async (_key, { arg }: { arg: Omit<Category, 'id' | 'sync_status' | 'is_deleted'> }) => {
    const timestamp = nowIso();
    const category: CategoryWriteInput = {
      ...arg,
      id: createUuid(),
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
    };
    await pushSyncChange({ categories: [toSyncCategoryItem(category)] });
    await mutate('categories');
    return normalizeCategory(category);
  });
}

export function useEditCategory() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('categories', async (_key, { arg }: { arg: { id: string } & Partial<Omit<Category, 'id'>> }) => {
    const existingCategory = await fetchSingle<Category>('categories', arg.id);
    const updatedCategory: CategoryWriteInput = {
      ...existingCategory,
      ...arg,
      updated_at: nowIso(),
    };
    await pushSyncChange({ categories: [toSyncCategoryItem(updatedCategory)] });
    await mutate('categories');
    return normalizeCategory(updatedCategory);
  });
}

export function useDeleteCategory() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('categories', async (_key, { arg }: { arg: { id: string } }) => {
    const existingCategory = await fetchSingle<Category>('categories', arg.id);
    const deletedAt = nowIso();
    await pushSyncChange({
      categories: [
        toSyncCategoryItem({
          ...existingCategory,
          is_deleted: true,
          deleted_at: deletedAt,
          updated_at: deletedAt,
        }),
      ],
    });
    await mutate('categories');
    return true;
  });
}

export function useAddGoal() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('savings_goals', async (_key, { arg }: { arg: Omit<Goal, 'id' | 'sync_status' | 'is_deleted'> }) => {
    const timestamp = nowIso();
    const goal: Goal = {
      id: createUuid(),
      ...arg,
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
    };
    await pushSyncChange({ goals: [toSyncGoalItem(goal, [])] });
    await mutate('savings_goals');
    return goal;
  });
}

export function useEditGoal() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('savings_goals', async (_key, { arg }: { arg: { id: string } & Partial<Omit<Goal, 'id'>> }) => {
    const existingGoal = await fetchSingle<Goal>('savings_goals', arg.id);
    const existingTransactions = await fetchGoalTransactionsByGoalId(arg.id);
    const updatedGoal: Goal = {
      ...existingGoal,
      ...arg,
      updated_at: nowIso(),
    };
    await pushSyncChange({ goals: [toSyncGoalItem(updatedGoal, existingTransactions)] });
    await mutate('savings_goals');
    return updatedGoal;
  });
}

export function useDeleteGoal() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('savings_goals', async (_key, { arg }: { arg: { id: string } }) => {
    const existingGoal = await fetchSingle<Goal>('savings_goals', arg.id);
    const existingTransactions = await fetchGoalTransactionsByGoalId(arg.id);
    const deletedAt = nowIso();
    await pushSyncChange({
      goals: [
        toSyncGoalItem(
          {
            ...existingGoal,
            is_deleted: true,
            deleted_at: deletedAt,
            updated_at: deletedAt,
          },
          existingTransactions
        ),
      ],
    });
    await mutate('savings_goals');
    return true;
  });
}

export function useAddGoalTransaction() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('goal_transactions', async (_key, { arg }: { arg: Omit<GoalTransaction, 'id'> }) => {
    const existingGoal = await fetchSingle<Goal>('savings_goals', arg.goal_id);
    const existingTransactions = await fetchGoalTransactionsByGoalId(arg.goal_id);
    const transaction: GoalTransaction = {
      id: createUuid(),
      ...arg,
    };
    await pushSyncChange({
      goals: [
        toSyncGoalItem(
          {
            ...existingGoal,
            updated_at: nowIso(),
          },
          [...existingTransactions, transaction]
        ),
      ],
    });
    await mutate('savings_goals');
    await mutate(['goal_transactions', arg.goal_id]);
    return transaction;
  });
}

export function useUpdateGoalBalance() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('savings_goals', async (_key, { arg }: { arg: { id: string; current_amount: number } }) => {
    const existingGoal = await fetchSingle<Goal>('savings_goals', arg.id);
    const existingTransactions = await fetchGoalTransactionsByGoalId(arg.id);
    const updatedGoal: Goal = {
      ...existingGoal,
      current_amount: arg.current_amount,
      updated_at: nowIso(),
    };
    await pushSyncChange({ goals: [toSyncGoalItem(updatedGoal, existingTransactions)] });
    await mutate('savings_goals');
    return true;
  });
}

export function useGoalTransactions(goalId?: string) {
  const fetcherByGoal = async () => {
    if (!goalId) return [];
    return fetchGoalTransactionsByGoalId(goalId);
  };

  const { data, error, isLoading, mutate } = useSWR(goalId ? ['goal_transactions', goalId] : null, fetcherByGoal);
  return {
    transactions: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useAddExpense() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('expenses', async (_key, { arg }: { arg: Omit<Expense, 'id' | 'created_at' | 'updated_at'> }) => {
    const timestamp = nowIso();
    const expense: ExpenseWriteInput = {
      ...arg,
      id: createUuid(),
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
    };
    await pushSyncChange({ expenses: [toSyncExpenseItem(expense)] });
    await mutate('expenses');
    revalidateFinanceSummary(mutate);
    return normalizeExpense(expense);
  });
}

export function useEditExpense() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('expenses', async (_key, { arg }: { arg: { id: string } & Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>> }) => {
    const existingExpense = await fetchSingle<Expense>('expenses', arg.id);
    const updatedExpense: ExpenseWriteInput = {
      ...existingExpense,
      ...arg,
      updated_at: nowIso(),
    };
    await pushSyncChange({ expenses: [toSyncExpenseItem(updatedExpense)] });
    await mutate('expenses');
    revalidateFinanceSummary(mutate);
    return normalizeExpense(updatedExpense);
  });
}

export function useDeleteExpense() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('expenses', async (_key, { arg }: { arg: { id: string } }) => {
    const existingExpense = await fetchSingle<Expense>('expenses', arg.id);
    const deletedAt = nowIso();
    await pushSyncChange({
      expenses: [
        toSyncExpenseItem({
          ...existingExpense,
          is_deleted: true,
          deleted_at: deletedAt,
          updated_at: deletedAt,
        }),
      ],
    });
    await mutate('expenses');
    revalidateFinanceSummary(mutate);
    return true;
  });
}

export function useRecurringExpenses() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<RecurringExpense[]>(user ? 'recurring_expenses' : null, fetcher);
  return {
    recurringExpenses: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useAddRecurringExpense() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('recurring_expenses', async (_key, { arg }: { arg: Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'synced_at' | 'is_deleted'> }) => {
    const timestamp = nowIso();
    const recurringExpense: RecurringExpense = {
      id: createUuid(),
      ...arg,
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
    };
    await pushSyncChange({ recurring: [toSyncRecurringItem(recurringExpense)] });
    await mutate('recurring_expenses');
    return recurringExpense;
  });
}

export function useEditRecurringExpense() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('recurring_expenses', async (_key, { arg }: { arg: { id: string } & Partial<Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'>> }) => {
    const existingRecurringExpense = await fetchSingle<RecurringExpense>('recurring_expenses', arg.id);
    const updatedRecurringExpense: RecurringExpense = {
      ...existingRecurringExpense,
      ...arg,
      updated_at: nowIso(),
    };
    await pushSyncChange({ recurring: [toSyncRecurringItem(updatedRecurringExpense)] });
    await mutate('recurring_expenses');
    return updatedRecurringExpense;
  });
}

export function useDeleteRecurringExpense() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('recurring_expenses', async (_key, { arg }: { arg: { id: string } }) => {
    const existingRecurringExpense = await fetchSingle<RecurringExpense>('recurring_expenses', arg.id);
    const deletedAt = nowIso();
    await pushSyncChange({
      recurring: [
        toSyncRecurringItem({
          ...existingRecurringExpense,
          is_deleted: true,
          deleted_at: deletedAt,
          updated_at: deletedAt,
        }),
      ],
    });
    await mutate('recurring_expenses');
    return true;
  });
}

export function useToggleRecurringExpense() {
  const { mutate } = useSWRConfig();
  return useSWRMutation('recurring_expenses', async (_key, { arg }: { arg: { id: string; isActive: boolean } }) => {
    const existingRecurringExpense = await fetchSingle<RecurringExpense>('recurring_expenses', arg.id);
    const updatedRecurringExpense: RecurringExpense = {
      ...existingRecurringExpense,
      is_active: arg.isActive,
      updated_at: nowIso(),
    };
    await pushSyncChange({ recurring: [toSyncRecurringItem(updatedRecurringExpense)] });
    await mutate('recurring_expenses');
    return true;
  });
}
