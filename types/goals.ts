export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  color: string;
  icon: string;
  is_archived?: boolean;
  sync_status?: 'pending' | 'synced';
  synced_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  retry_count?: number;
  last_error?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GoalTransaction {
  id: string;
  goal_id: string;
  amount: number;
  date: string;
  type: 'deposit' | 'withdraw';
  note?: string;
}
