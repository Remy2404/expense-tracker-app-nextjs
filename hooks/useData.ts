import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { useSWRConfig } from 'swr';
import { supabase } from '@/lib/supabase';
import { Expense, Category, Budget } from '@/types';
import { Goal } from '@/types/goals';
import { useAuth } from '@/contexts/AuthContext';
import { MOBILE_DEFAULT_CATEGORIES } from '@/constants/defaultCategories';

// Generic fetcher using Supabase client
const fetcher = async (table: string) => {
  const { data, error } = await supabase.from(table).select('*').neq('is_deleted', true);
  if (error) throw error;
  return data;
};

export function useExpenses() {
  const { data, error, isLoading, mutate } = useSWR<Expense[]>('expenses', fetcher);

  return {
    expenses: data || [],
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

  useEffect(() => {
    if (!user?.uid || isLoading || !data || inFlightRef.current) return;

    const currentKey = `${user.uid}:${data.length}`;
    if (seededRef.current === currentKey) return;

    const existingNames = new Set(data.map((cat) => cat.name.trim().toLowerCase()));
    const missingDefaults = MOBILE_DEFAULT_CATEGORIES.filter(
      (defaultCat) => !existingNames.has(defaultCat.name.trim().toLowerCase())
    );

    if (missingDefaults.length === 0) {
      seededRef.current = currentKey;
      return;
    }

    inFlightRef.current = true;

    const seedDefaults = async () => {
      const payload = missingDefaults.map((category) => ({
        ...category,
        firebase_uid: user.uid,
      }));

      const { error: insertError } = await supabase.from('categories').insert(payload);

      if (insertError) {
        // Fallback: insert one-by-one so partial success is possible under stricter DB/RLS constraints
        for (const category of payload) {
          const { error: singleInsertError } = await supabase.from('categories').insert(category);
          if (singleInsertError) {
            console.warn('Skip default category seed', {
              name: category.name,
              message: singleInsertError.message,
              code: singleInsertError.code,
              details: singleInsertError.details,
            });
          }
        }
      }

      inFlightRef.current = false;
      seededRef.current = currentKey;
      mutate();
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
      const payload = { ...arg, firebase_uid: user.uid };
      const { data, error } = await supabase.from('categories').insert(payload).select().single();
      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
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

export function useAddExpense() {
  const { mutate } = useSWRConfig();
  const { user } = useAuth();
  return useSWRMutation(
    'expenses',
    async (_key, { arg }: { arg: Omit<Expense, 'id' | 'created_at' | 'updated_at'> }) => {
      if (!user?.uid) throw new Error('User not authenticated');
      const payload = { ...arg, firebase_uid: user.uid };
      const { data, error } = await supabase.from('expenses').insert(payload).select().single();
      if (error) throw error;
      return data;
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
      const { data, error } = await supabase.from('expenses').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
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
