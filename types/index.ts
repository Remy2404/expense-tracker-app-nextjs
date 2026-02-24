export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  date: Date | string; // Handle both parsed and serialized
  notes?: string;
  currency?: string;
  sync_status?: 'pending' | 'synced';
  is_deleted?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  sync_status?: 'pending' | 'synced';
  is_deleted?: boolean;
}

export interface Budget {
  id: string;
  month: string; // Format: "YYYY-MM"
  totalAmount: number;
  categoryBudgets: { categoryId: string; amount: number }[];
  sync_status?: 'pending' | 'synced';
  is_deleted?: boolean;
}

export interface AiParseResponse {
  amount?: number;
  categoryId?: string;
  date?: string;
  notes?: string;
  confidence: number;
  suggestedCategories?: { id: string; name: string; probability: number }[];
}
