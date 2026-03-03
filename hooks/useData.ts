import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { useSWRConfig } from 'swr';
import { supabase } from '@/lib/supabase';
import { financeApi, type FinanceSummaryPeriod, type FinanceSummaryResponse } from '@/lib/api/finance.api';
import { Expense, Category, CategoryType, Budget, RecurringExpense } from '@/types';
import { Goal, GoalTransaction } from '@/types/goals';
import { useAuth } from '@/contexts/AuthContext';
import { MOBILE_DEFAULT_CATEGORIES } from '@/constants/defaultCategories';
import {
  DEFAULT_CATEGORY_TYPE,
  DEFAULT_TRANSACTION_TYPE,
  getCategoryType,
  getTransactionType,
} from '@/lib/transactions';

type CategoryWriteInput = Partial<Category> & {
  category_type?: string | null;
};

const normalizeCategory = (category: CategoryWriteInput): Category => {
  const resolvedType = getCategoryType(category as Pick<Category, 'type' | 'category_type'>);
  return {
    ...category,
    type: resolvedType,
    category_type: resolvedType,
  } as Category;
};

const toCategoryInsertPayload = (category: CategoryWriteInput) => {
  const { type, ...rest } = category;
  return {
    ...rest,
    category_type: getCategoryType({
      type: type as CategoryType | undefined,
      category_type: category.category_type as CategoryType | undefined,
    }).toUpperCase(),
  };
};

const toCategoryUpdatePayload = (category: CategoryWriteInput) => {
  const { type, ...rest } = category;
  if (type === undefined && category.category_type === undefined) return rest;
  return {
    ...rest,
    category_type: getCategoryType({
      type: type as CategoryType | undefined,
      category_type: category.category_type as CategoryType | undefined,
    }).toUpperCase(),
  };
};

type ExpenseWriteInput = Partial<Expense> & {
  transaction_type?: string | null;
};

const normalizeExpense = (expense: ExpenseWriteInput): Expense => {
  const resolvedType = getTransactionType(expense as Pick<Expense, 'transaction_type'>);
  return {
    ...expense,
    transaction_type: resolvedType,
  } as Expense;
};

const toExpenseWritePayload = (
  expense: ExpenseWriteInput,
  options?: { includeDefaultType?: boolean }
) => {
  const { transaction_type, ...rest } = expense;
  if (transaction_type === undefined && !options?.includeDefaultType) {
    return rest;
  }
  const normalizedType = getTransactionType({
    transaction_type: (transaction_type ?? DEFAULT_TRANSACTION_TYPE) as Expense['transaction_type'],
  });
  return {
    ...rest,
    transaction_type: normalizedType.toUpperCase(),
  };
};

// Generic fetcher using Supabase client
const fetcher = async (table: string) => {
  // Get the current user from auth context
  const { supabase } = await import('@/lib/supabase');
  const { data: { user } } = await supabase.auth.getUser();

  let baseQuery = supabase.from(table).select('*').neq('is_deleted', true);

  // Filter by user for user-specific tables
  if (user && ['expenses', 'categories', 'budgets', 'recurring_expenses', 'savings_goals'].includes(table)) {
    // Note: supabase.auth.getUser() returns the user from the Firebase JWT token
    // so user.id corresponds to the Firebase UID which matches firebase_uid in the database
    baseQuery = baseQuery.eq('firebase_uid', user.id);
  }

  const query =
    table === 'expenses'
      ? baseQuery
          .order('created_at', { ascending: false })
          .order('updated_at', { ascending: false })
          .order('date', { ascending: false })
          .order('id', { ascending: false })
      : baseQuery;
  const { data, error } = await query;
  if (error) throw error;
  if (table === 'categories') {
    return (data || []).map((category) => normalizeCategory(category as CategoryWriteInput));
  }
  if (table === 'expenses') {
    return (data || []).map((expense) => normalizeExpense(expense as ExpenseWriteInput));
  }
  return data;
};

export function useExpenses() {
  const { data, error, isLoading, mutate } = useSWR<Expense[]>('expenses', fetcher, {
    refreshInterval: 5000,
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
  const { data, error, isLoading, mutate } = useSWR<FinanceSummaryResponse>(
    ['finance-summary', period],
    () => financeApi.getSummary(period),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
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
  const { data, error, isLoading, mutate } = useSWR<Category[]>('categories', fetcher);

  // Helper to ensure profile exists before seeding
  const ensureProfileExists = async (firebaseUid: string) => {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('firebase_uid')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (existingProfile) return true;

    // Create profile if it doesn't exist
    const { error: insertError } = await supabase.from('profiles').insert({
      firebase_uid: firebaseUid,
    });

    if (insertError) {
      console.warn('Failed to create profile:', insertError.message);
      return false;
    }

    return true;
  };

  useEffect(() => {
    // Don't run if: no user, still loading, no data, or already processing
    if (!user?.uid || isLoading || !data) return;

    // Skip if already seeded for this user+count combination
    const currentKey = `${user.uid}:${data.length}`;
    if (seededRef.current === currentKey) return;

    // Skip if currently inserting
    if (inFlightRef.current) return;

    // Get existing category names (case-insensitive)
    const existingNames = new Set(data.map((cat) => cat.name.trim().toLowerCase()));

    // Find missing default categories
    const missingDefaults = MOBILE_DEFAULT_CATEGORIES.filter(
      (defaultCat) => !existingNames.has(defaultCat.name.trim().toLowerCase())
    );

    // If all defaults exist, mark as seeded and return
    if (missingDefaults.length === 0) {
      seededRef.current = currentKey;
      return;
    }

    // Mark as in-flight to prevent duplicate calls
    inFlightRef.current = true;

    const seedDefaults = async () => {
      try {
        // First ensure profile exists (required for foreign key)
        const profileReady = await ensureProfileExists(user.uid);
        if (!profileReady) {
          console.warn('Profile not ready, skipping category seeding');
          inFlightRef.current = false;
          seededRef.current = currentKey;
          return;
        }

        // Prepare payload with firebase_uid
        const payload = missingDefaults.map((category) => ({
          ...toCategoryInsertPayload(category),
          firebase_uid: user.uid,
        }));

        // Try bulk insert first
        const { error: insertError } = await supabase.from('categories').insert(payload);

        if (insertError) {
          console.warn('Bulk insert failed, trying one-by-one:', insertError.message);
          // Fallback: insert one-by-one so partial success is possible under stricter DB/RLS constraints
          for (const category of payload) {
            const { error: singleInsertError } = await supabase.from('categories').insert(category);
            if (singleInsertError) {
              console.warn('Skip default category seed', {
                name: category.name,
                message: singleInsertError.message,
                code: singleInsertError.code,
              });
            }
          }
        }

        // Update the cache to reflect the new categories
        mutate();
      } catch (err) {
        console.error('Error seeding default categories:', err);
      } finally {
        inFlightRef.current = false;
        seededRef.current = currentKey;
      }
    };

    seedDefaults();
  }, [user?.uid, data, isLoading, mutate]);

  return {
    categories: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useBudgets() {
  const { data, error, isLoading, mutate } = useSWR<Budget[]>('budgets', fetcher);

  return {
    budgets: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useAddBudget() {
  const { mutate } = useSWRConfig();
  const { user } = useAuth();
  return useSWRMutation(
    'budgets',
    async (_key, { arg }: { arg: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'synced_at' | 'is_deleted'> }) => {
      if (!user?.uid) throw new Error('User not authenticated');
      const payload = { ...arg, firebase_uid: user.uid };
      const { data, error } = await supabase.from('budgets').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        mutate('budgets');
      },
    }
  );
}

export function useEditBudget() {
  const { mutate } = useSWRConfig();
  return useSWRMutation(
    'budgets',
    async (_key, { arg }: { arg: { id: string } & Partial<Omit<Budget, 'id' | 'created_at' | 'updated_at'>> }) => {
      const { id, ...updates } = arg;
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        mutate('budgets');
      },
    }
  );
}

export function useDeleteBudget() {
  const { mutate } = useSWRConfig();
  return useSWRMutation(
    'budgets',
    async (_key, { arg }: { arg: { id: string } }) => {
      const { error } = await supabase
        .from('budgets')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', arg.id);
      if (error) throw error;
      return true;
    },
    {
      onSuccess: () => {
        mutate('budgets');
      },
    }
  );
}

export function useGoals() {
  const { data, error, isLoading, mutate } = useSWR<Goal[]>(
    'savings_goals',
    fetcher
  );

  return {
    goals: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// Fetch a single month budget if needed
export function useBudgetByMonth(month: string) {
  const fetcherByMonth = async () => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', month)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows
    return data as Budget | null;
  };

  const { data, error, isLoading, mutate } = useSWR(
    month ? ['budgets', month] : null,
    fetcherByMonth
  );

  return {
    budget: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useAddCategory() {
  const { mutate } = useSWRConfig();
  const { user } = useAuth();
  return useSWRMutation(
    'categories',
    async (_key, { arg }: { arg: Omit<Category, 'id' | 'sync_status' | 'is_deleted'> }) => {
      if (!user?.uid) throw new Error('User not authenticated');
      const payload = { ...toCategoryInsertPayload(arg), firebase_uid: user.uid };
      const { data, error } = await supabase.from('categories').insert(payload).select().single();
      if (error) throw error;
      return normalizeCategory(data as CategoryWriteInput);
    },
    {
      onSuccess: () => {
        mutate('categories');
      },
    }
  );
}

export function useEditCategory() {
  const { mutate } = useSWRConfig();
  return useSWRMutation(
    'categories',
    async (_key, { arg }: { arg: { id: string } & Partial<Omit<Category, 'id'>> }) => {
      const { id, ...updates } = arg;
      const payload = toCategoryUpdatePayload(updates);
      const { data, error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return normalizeCategory(data as CategoryWriteInput);
    },
    {
      onSuccess: () => {
        mutate('categories');
      },
    }
  );
}

export function useDeleteCategory() {
  const { mutate } = useSWRConfig();
  return useSWRMutation(
    'categories',
    async (_key, { arg }: { arg: { id: string } }) => {
      const { error } = await supabase
        .from('categories')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', arg.id);
      if (error) throw error;
      return true;
    },
    {
      onSuccess: () => {
        mutate('categories');
      },
    }
  );
}

export function useAddGoal() {
  const { mutate } = useSWRConfig();
  const { user } = useAuth();
  return useSWRMutation(
    'savings_goals',
    async (_key, { arg }: { arg: Omit<Goal, 'id' | 'sync_status' | 'is_deleted'> }) => {
      if (!user?.uid) throw new Error('User not authenticated');
      const payload = { ...arg, firebase_uid: user.uid };
      const { data, error } = await supabase
        .from('savings_goals')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        mutate('savings_goals');
      },
    }
  );
}

export function useEditGoal() {
  const { mutate } = useSWRConfig();
  return useSWRMutation(
    'savings_goals',
    async (_key, { arg }: { arg: { id: string } & Partial<Omit<Goal, 'id'>> }) => {
      const { id, ...updates } = arg;
      const { data, error } = await supabase
        .from('savings_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        mutate('savings_goals');
      },
    }
  );
}

export function useDeleteGoal() {
  const { mutate } = useSWRConfig();
  return useSWRMutation(
    'savings_goals',
    async (_key, { arg }: { arg: { id: string } }) => {
      const { error } = await supabase
        .from('savings_goals')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', arg.id);
      if (error) throw error;
      return true;
    },
    {
      onSuccess: () => {
        mutate('savings_goals');
      },
    }
  );
}

export function useAddGoalTransaction() {
  const { mutate } = useSWRConfig();
  const { user } = useAuth();
  return useSWRMutation(
    'goal_transactions',
    async (_key, { arg }: { arg: Omit<GoalTransaction, 'id'> }) => {
      if (!user?.uid) throw new Error('User not authenticated');
      const { data, error } = await supabase.from('goal_transactions').insert(arg).select().single();
      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        mutate('savings_goals');
      },
    }
  );
}

export function useUpdateGoalBalance() {
  const { mutate } = useSWRConfig();
  return useSWRMutation(
    'savings_goals',
    async (_key, { arg }: { arg: { id: string; current_amount: number } }) => {
      const { id, current_amount } = arg;
      const { error } = await supabase
        .from('savings_goals')
        .update({ current_amount, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return true;
    },
    {
      onSuccess: () => {
        mutate('savings_goals');
      },
    }
  );
}

export function useGoalTransactions(goalId?: string) {
  const fetcherByGoal = async () => {
    if (!goalId) return [];
    const { data, error } = await supabase
      .from('goal_transactions')
      .select('*')
      .eq('goal_id', goalId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });
    if (error) throw error;
    return data as GoalTransaction[];
  };

  const { data, error, isLoading, mutate } = useSWR(
    goalId ? ['goal_transactions', goalId] : null,
    fetcherByGoal
  );

  return {
    transactions: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useAddExpense() {
  const { mutate } = useSWRConfig();
  const { user } = useAuth();
  return useSWRMutation(
    'expenses',
    async (_key, { arg }: { arg: Omit<Expense, 'id' | 'created_at' | 'updated_at'> }) => {
      if (!user?.uid) throw new Error('User not authenticated');
      const payload = { ...arg, firebase_uid: user.uid };
      const { data, error } = await supabase
        .from('expenses')
        .insert(toExpenseWritePayload(payload, { includeDefaultType: true }))
        .select()
        .single();
      if (error) throw error;
      return normalizeExpense(data as ExpenseWriteInput);
    },
    {
      onSuccess: () => {
        mutate('expenses');
      },
    }
  );
}

export function useEditExpense() {
  const { mutate } = useSWRConfig();
  return useSWRMutation(
    'expenses',
    async (_key, { arg }: { arg: { id: string } & Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>> }) => {
      const { id, ...updates } = arg;
      const { data, error } = await supabase
        .from('expenses')
        .update(toExpenseWritePayload(updates))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return normalizeExpense(data as ExpenseWriteInput);
    },
    {
      onSuccess: () => {
        mutate('expenses');
      },
    }
  );
}

export function useDeleteExpense() {
  const { mutate } = useSWRConfig();
  return useSWRMutation(
    'expenses',
    async (_key, { arg }: { arg: { id: string } }) => {
      const { error } = await supabase
        .from('expenses')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', arg.id);
      if (error) throw error;
      return true;
    },
    {
      onSuccess: () => {
        mutate('expenses');
      },
    }
  );
}

// Recurring Expenses Hooks
export function useRecurringExpenses() {
  const { data, error, isLoading, mutate } = useSWR<RecurringExpense[]>(
    'recurring_expenses',
    fetcher
  );

  return {
    recurringExpenses: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useAddRecurringExpense() {
  const { mutate } = useSWRConfig();
  const { user } = useAuth();
  return useSWRMutation(
    'recurring_expenses',
    async (_key, { arg }: { arg: Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'synced_at' | 'is_deleted'> }) => {
      if (!user?.uid) throw new Error('User not authenticated');
      const payload = { ...arg, firebase_uid: user.uid };
      const { data, error } = await supabase.from('recurring_expenses').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        mutate('recurring_expenses');
      },
    }
  );
}

export function useEditRecurringExpense() {
  const { mutate } = useSWRConfig();
  return useSWRMutation(
    'recurring_expenses',
    async (_key, { arg }: { arg: { id: string } & Partial<Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'>> }) => {
      const { id, ...updates } = arg;
      const { data, error } = await supabase
        .from('recurring_expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        mutate('recurring_expenses');
      },
    }
  );
}

export function useDeleteRecurringExpense() {
  const { mutate } = useSWRConfig();
  return useSWRMutation(
    'recurring_expenses',
    async (_key, { arg }: { arg: { id: string } }) => {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', arg.id);
      if (error) throw error;
      return true;
    },
    {
      onSuccess: () => {
        mutate('recurring_expenses');
      },
    }
  );
}

export function useToggleRecurringExpense() {
  const { mutate } = useSWRConfig();
  return useSWRMutation(
    'recurring_expenses',
    async (_key, { arg }: { arg: { id: string; isActive: boolean } }) => {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({ is_active: arg.isActive, updated_at: new Date().toISOString() })
        .eq('id', arg.id);
      if (error) throw error;
      return true;
    },
    {
      onSuccess: () => {
        mutate('recurring_expenses');
      },
    }
  );
}
