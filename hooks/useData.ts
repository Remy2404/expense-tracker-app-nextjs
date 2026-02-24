import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { Expense, Category, Budget } from '@/types';

// Generic fetcher using Supabase client
const fetcher = async (table: string) => {
  const { data, error } = await supabase.from(table).select('*');
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
  const { data, error, isLoading, mutate } = useSWR<Category[]>('categories', fetcher);

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

import useSWRMutation from 'swr/mutation';
import { useSWRConfig } from 'swr';

export function useAddExpense() {
  const { mutate } = useSWRConfig();
  return useSWRMutation(
    'expenses',
    async (key, { arg }: { arg: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> }) => {
      const { data, error } = await supabase.from('expenses').insert(arg).select().single();
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
