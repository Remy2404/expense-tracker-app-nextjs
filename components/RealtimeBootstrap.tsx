'use client';

import { useEffect } from 'react';
import { useSWRConfig } from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { webRealtimeClient } from '@/lib/realtime/client';

const shouldRevalidateKey = (key: unknown, entities?: string[]) => {
  if (typeof key === 'string') {
    const entitySet = new Set(entities ?? []);
    if (key === '/api/ai/nudges') {
      return true;
    }
    if (key === 'dashboard-summary') {
      return true;
    }
    if (key === 'expenses') {
      return entities == null || entitySet.size === 0 || entitySet.has('expenses');
    }
    if (key === 'categories') {
      return entities == null || entitySet.size === 0 || entitySet.has('categories');
    }
    if (key === 'budgets') {
      return entities == null || entitySet.size === 0 || entitySet.has('budgets');
    }
    if (key === 'savings_goals') {
      return entities == null || entitySet.size === 0 || entitySet.has('goals');
    }
    if (key === 'recurring_expenses') {
      return entities == null || entitySet.size === 0 || entitySet.has('recurring');
    }
    return false;
  }

  if (Array.isArray(key) && key[0] === 'finance-summary') {
    return true;
  }
  if (Array.isArray(key) && key[0] === 'budget-summary') {
    return true;
  }

  return false;
};

export function RealtimeBootstrap() {
  const { user } = useAuth();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!user) {
      webRealtimeClient.disconnect();
      return;
    }

    void webRealtimeClient.connect();
    const unsubscribe = webRealtimeClient.subscribe('sync.updated', (payload) => {
      void mutate(
        (key) => shouldRevalidateKey(key, payload.entities),
        undefined,
        { revalidate: true }
      );
    });

    return () => {
      unsubscribe();
      webRealtimeClient.disconnect();
    };
  }, [mutate, user]);

  // Reconnect when the tab becomes visible again (e.g. after backgrounding or
  // a backend restart). connect() is a no-op if the socket is already healthy.
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void webRealtimeClient.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  return null;
}
