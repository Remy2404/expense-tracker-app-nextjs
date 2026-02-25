export type SplitType = 'equal' | 'custom';

export interface BillSplitGroup {
  id: string;
  name: string;
  currency: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  is_deleted?: boolean;
}

export interface BillSplitParticipant {
  id: string;
  group_id: string;
  name: string;
  user_id?: string | null;
  created_at: string;
}

export interface BillSplitExpense {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  currency: string;
  payer_participant_id: string;
  split_type: SplitType;
  date: string;
  notes?: string | null;
  created_at: string;
}

export interface BillSplitShare {
  id: string;
  expense_id: string;
  participant_id: string;
  amount: number;
  is_settled: boolean;
  settled_at?: string | null;
}

export interface BillSplitSettlement {
  id: string;
  group_id: string;
  expense_id: string;
  participant_id: string;
  amount: number;
  method: string;
  note?: string | null;
  created_at: string;
}

export interface GroupSummary extends BillSplitGroup {
  participantsCount: number;
  expensesCount: number;
  unsettledSharesCount: number;
  totalExpenses: number;
}

export interface GroupDetailsPayload {
  group: BillSplitGroup;
  participants: BillSplitParticipant[];
  expenses: BillSplitExpense[];
  shares: BillSplitShare[];
  settlements: BillSplitSettlement[];
}

export interface ComputedParticipantBalance {
  participantId: string;
  participantName: string;
  balance: number; // + means should receive, - means owes
}
