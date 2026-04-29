'use client';

import { useEffect, useRef } from 'react';
import { useSWRConfig } from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { webRealtimeClient } from '@/lib/realtime/client';

const hasRelevantEntity = (entities: string[] | undefined, relevantEntities: string[]) => {
  if (entities == null || entities.length === 0) {
    return true;
  }

  const entitySet = new Set(entities);
  return relevantEntities.some((entity) => entitySet.has(entity));
};

const shouldRevalidateKey = (key: unknown, entities?: string[]) => {
  if (typeof key === 'string') {
    if (key === '/api/ai/nudges') {
      return hasRelevantEntity(entities, ['expenses', 'categories', 'budgets', 'goals', 'recurring']);
    }
    if (key === 'dashboard-summary') {
      return hasRelevantEntity(entities, ['expenses', 'categories', 'budgets']);
    }
    if (key === 'expenses') {
      return hasRelevantEntity(entities, ['expenses']);
    }
    if (key === 'categories') {
      return hasRelevantEntity(entities, ['categories']);
    }
    if (key === 'budgets') {
      return hasRelevantEntity(entities, ['budgets']);
    }
    if (key === 'savings_goals') {
      return hasRelevantEntity(entities, ['goals']);
    }
    if (key === 'recurring_expenses') {
      return hasRelevantEntity(entities, ['recurring']);
    }
    return false;
  }

  if (Array.isArray(key) && key[0] === 'finance-summary') {
    return hasRelevantEntity(entities, ['expenses']);
  }
  if (Array.isArray(key) && key[0] === 'budget-summary') {
    return hasRelevantEntity(entities, ['expenses', 'budgets']);
  }

  return false;
};

export function RealtimeBootstrap() {
  const { user } = useAuth();
  const { mutate } = useSWRConfig();
  const uid = user?.uid ?? null;
  const mutateRef = useRef(mutate);

  useEffect(() => {
    mutateRef.current = mutate;
  }, [mutate]);

  useEffect(() => {
    if (!uid) {
      webRealtimeClient.disconnect();
      return;
    }

    void webRealtimeClient.connect();
    const unsubscribe = webRealtimeClient.subscribe('sync.updated', (payload) => {
      void mutateRef.current(
        (key) => shouldRevalidateKey(key, payload.entities),
        undefined,
        { revalidate: true, populateCache: false }
      );
    });

    return () => {
      unsubscribe();
    };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void webRealtimeClient.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [uid]);

  return null;
}
