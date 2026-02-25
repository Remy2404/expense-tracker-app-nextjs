export interface Expense {
  id: string;
  amount: number;
  category_id?: string;
  date: Date | string; // Handle both parsed and serialized
  notes?: string;
  recurring_expense_id?: string;
  receipt_paths?: string[];
  currency?: string;
  original_amount?: number;
  exchange_rate?: number;
  rate_source?: 'api' | 'manual' | 'cached';
  merchant?: string;
  note?: string;
  ai_category_id?: string;
  ai_confidence?: number;
  ai_source?: 'memory' | 'gemini' | 'gemini_vision' | 'manual';
  ai_last_updated?: string;
  sync_status?: 'pending' | 'synced';
  synced_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  retry_count?: number;
  last_error?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default?: boolean;
  sort_order?: number;
  sync_status?: 'pending' | 'synced';
  synced_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  retry_count?: number;
  last_error?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  month: string; // Format: "YYYY-MM"
  total_amount: number;
  sync_status?: 'pending' | 'synced';
  synced_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  retry_count?: number;
  last_error?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AiParseResponse {
  amount?: number;
  category_id?: string;
  date?: string;
  notes?: string;
  merchant?: string;
  confidence: number;
  suggestedCategories?: { id: string; name: string; probability: number }[];
}

export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurringExpense {
  id: string;
  amount: number;
  category_id: string;
  notes?: string;
  frequency: RecurringFrequency;
  currency?: string;
  original_amount?: number;
  exchange_rate?: number;
  start_date: Date | string;
  end_date?: Date | string;
  last_generated?: Date | string;
  next_due_date: Date | string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  notification_enabled: boolean;
  notification_days_before: number;
  sync_status?: 'pending' | 'synced';
  synced_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
}
