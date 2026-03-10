import { aiHttpClient, normalizeAiApiError } from './http';

export interface SyncCategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  category_type: 'EXPENSE' | 'INCOME';
  sort_order?: number | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  retry_count?: number | null;
  last_error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  synced_at?: string | null;
  version?: number | null;
}

export interface SyncExpenseItem {
  id: string;
  amount: number;
  transaction_type: 'EXPENSE' | 'INCOME';
  category_id?: string | null;
  date: string;
  notes?: string | null;
  merchant?: string | null;
  note_summary?: string | null;
  ai_category_id?: string | null;
  ai_confidence?: number | null;
  ai_source?: string | null;
  ai_last_updated?: string | null;
  recurring_expense_id?: string | null;
  receipt_paths?: string[];
  currency?: string | null;
  original_amount?: number | null;
  exchange_rate?: number | null;
  rate_source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  synced_at?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  retry_count?: number | null;
  last_error?: string | null;
  version?: number | null;
}

export interface SyncCategoryBudgetItem {
  category_id?: string | null;
  amount: number;
}

export interface SyncBudgetItem {
  id: string;
  month: string;
  total_amount: number;
  category_budgets: SyncCategoryBudgetItem[];
  created_at?: string | null;
  updated_at?: string | null;
  synced_at?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  retry_count?: number | null;
  last_error?: string | null;
  version?: number | null;
}

export interface SyncGoalTransactionItem {
  id: string;
  amount: number;
  type: 'deposit' | 'withdraw';
  note?: string | null;
  date: string;
}

export interface SyncGoalItem {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string | null;
  color: string;
  icon: string;
  is_archived?: boolean;
  transactions: SyncGoalTransactionItem[];
  created_at?: string | null;
  updated_at?: string | null;
  synced_at?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  retry_count?: number | null;
  last_error?: string | null;
  version?: number | null;
}

export interface SyncRecurringItem {
  id: string;
  amount: number;
  category_id?: string | null;
  notes?: string | null;
  frequency: string;
  currency?: string | null;
  original_amount?: number | null;
  exchange_rate?: number | null;
  start_date: string;
  end_date?: string | null;
  last_generated?: string | null;
  next_due_date: string;
  is_active?: boolean;
  notification_enabled?: boolean;
  notification_days_before?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  synced_at?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  retry_count?: number | null;
  last_error?: string | null;
  version?: number | null;
}

export interface SyncPushRequest {
  categories?: SyncCategoryItem[];
  expenses?: SyncExpenseItem[];
  budgets?: SyncBudgetItem[];
  goals?: SyncGoalItem[];
  recurring?: SyncRecurringItem[];
  bill_split_dirty?: boolean;
}
export interface SyncPushResponse {
  synced_items: {
    expenses: number;
    categories: number;
    budgets: number;
    goals: number;
    recurring: number;
    bill_split: number;
  };
  failed_items: Array<{
    id: string;
    entity_type: string;
    error: string;
  }>;
}

export interface SyncPullResponse {
  expenses: SyncExpenseItem[];
  categories: SyncCategoryItem[];
  budgets: SyncBudgetItem[];
  goals: SyncGoalItem[];
  recurring: SyncRecurringItem[];
}

export interface SyncPullRequest {
  expense_since?: string;
  category_since?: string;
  budget_since?: string;
  goal_since?: string;
  recurring_since?: string;
}

const toSyncArray = <T>(items?: T[] | null): T[] => (Array.isArray(items) ? items : []);

const createEmptySyncPushResponse = (): SyncPushResponse => ({
  synced_items: {
    expenses: 0,
    categories: 0,
    budgets: 0,
    goals: 0,
    recurring: 0,
    bill_split: 0,
  },
  failed_items: [],
});

const hasSyncPushChanges = (payload: SyncPushRequest): boolean =>
  toSyncArray(payload.categories).length > 0 ||
  toSyncArray(payload.expenses).length > 0 ||
  toSyncArray(payload.budgets).length > 0 ||
  toSyncArray(payload.goals).length > 0 ||
  toSyncArray(payload.recurring).length > 0;

const normalizeSyncPushPayload = (payload: SyncPushRequest): SyncPushRequest => {
  const normalized: SyncPushRequest = {};

  if (toSyncArray(payload.categories).length > 0) {
    normalized.categories = toSyncArray(payload.categories);
  }
  if (toSyncArray(payload.expenses).length > 0) {
    normalized.expenses = toSyncArray(payload.expenses);
  }
  if (toSyncArray(payload.budgets).length > 0) {
    normalized.budgets = toSyncArray(payload.budgets);
  }
  if (toSyncArray(payload.goals).length > 0) {
    normalized.goals = toSyncArray(payload.goals);
  }
  if (toSyncArray(payload.recurring).length > 0) {
    normalized.recurring = toSyncArray(payload.recurring);
  }
  if (payload.bill_split_dirty) {
    normalized.bill_split_dirty = true;
  }

  return normalized;
};

const normalizePullParams = (params: SyncPullRequest): SyncPullRequest =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => typeof value === 'string' && value.trim().length > 0
    )
  ) as SyncPullRequest;

export const syncApi = {
  async pushChanges(payload: SyncPushRequest): Promise<SyncPushResponse> {
    try {
      const normalizedPayload = normalizeSyncPushPayload(payload);
      if (!hasSyncPushChanges(normalizedPayload)) {
        return createEmptySyncPushResponse();
      }

      const response = await aiHttpClient.post('/api/sync/push', normalizedPayload);
      return response.data as SyncPushResponse;
    } catch (error) {
      throw normalizeAiApiError(error);
    }
  },

  async pullChanges(params: SyncPullRequest = {}): Promise<SyncPullResponse> {
    try {
      const response = await aiHttpClient.get('/api/sync/pull', {
        params: normalizePullParams(params),
      });
      return response.data as SyncPullResponse;
    } catch (error) {
      throw normalizeAiApiError(error);
    }
  },
};
