import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { useSWRConfig } from 'swr';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  BillSplitExpense,
  BillSplitGroup,
  BillSplitParticipant,
  BillSplitSettlement,
  BillSplitShare,
  GroupDetailsPayload,
  GroupSummary,
} from '@/types/billSplit';
import { buildEqualShares } from '@/lib/billSplit';

const KEY_GROUPS = 'bill-split-groups';

const mapGroupSummary = (
  group: BillSplitGroup,
  participants: BillSplitParticipant[],
  expenses: BillSplitExpense[],
  shares: BillSplitShare[]
): GroupSummary => {
  const groupExpenses = expenses.filter((expense) => expense.group_id === group.id);
  const expenseIds = new Set(groupExpenses.map((expense) => expense.id));

  return {
    ...group,
    participantsCount: participants.filter((participant) => participant.group_id === group.id).length,
    expensesCount: groupExpenses.length,
    unsettledSharesCount: shares.filter((share) => expenseIds.has(share.expense_id) && !share.is_settled).length,
    totalExpenses: Number(groupExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0).toFixed(2)),
  };
};

export function useBillSplitGroups() {
  const { user } = useAuth();

  const fetcher = async (): Promise<GroupSummary[]> => {
    if (!user?.uid) return [];

    const [{ data: groups, error: groupError }, { data: participants, error: participantError }, { data: expenses, error: expenseError }, { data: shares, error: shareError }] = await Promise.all([
      supabase.from('bill_split_groups').select('*').eq('created_by', user.uid).neq('is_deleted', true).order('created_at', { ascending: false }),
      supabase.from('bill_split_participants').select('*'),
      supabase.from('bill_split_expenses').select('*').order('date', { ascending: false }),
      supabase.from('bill_split_shares').select('*'),
    ]);

    if (groupError) throw groupError;
    if (participantError) throw participantError;
    if (expenseError) throw expenseError;
    if (shareError) throw shareError;

    const safeGroups = (groups ?? []) as BillSplitGroup[];
    return safeGroups.map((group) =>
      mapGroupSummary(
        group,
        (participants ?? []) as BillSplitParticipant[],
        (expenses ?? []) as BillSplitExpense[],
        (shares ?? []) as BillSplitShare[]
      )
    );
  };

  const { data, error, isLoading, mutate } = useSWR(user?.uid ? KEY_GROUPS : null, fetcher);

  return {
    groups: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useBillSplitGroupDetails(groupId?: string) {
  const fetcher = async (): Promise<GroupDetailsPayload> => {
    if (!groupId) throw new Error('Group not found.');

    const [{ data: group, error: groupError }, { data: participants, error: participantsError }, { data: expenses, error: expensesError }, { data: settlements, error: settlementsError }] = await Promise.all([
      supabase.from('bill_split_groups').select('*').eq('id', groupId).single(),
      supabase.from('bill_split_participants').select('*').eq('group_id', groupId).order('created_at', { ascending: true }),
      supabase.from('bill_split_expenses').select('*').eq('group_id', groupId).order('date', { ascending: false }),
      supabase.from('bill_split_settlements').select('*').eq('group_id', groupId).order('created_at', { ascending: false }),
    ]);

    if (groupError) throw groupError;
    if (participantsError) throw participantsError;
    if (expensesError) throw expensesError;
    if (settlementsError) throw settlementsError;

    const expenseIds = ((expenses ?? []) as BillSplitExpense[]).map((expense) => expense.id);
    let shares: BillSplitShare[] = [];

    if (expenseIds.length > 0) {
      const { data: shareData, error: sharesError } = await supabase
        .from('bill_split_shares')
        .select('*')
        .in('expense_id', expenseIds);
      if (sharesError) throw sharesError;
      shares = (shareData ?? []) as BillSplitShare[];
    }

    return {
      group: group as BillSplitGroup,
      participants: (participants ?? []) as BillSplitParticipant[],
      expenses: (expenses ?? []) as BillSplitExpense[],
      shares,
      settlements: (settlements ?? []) as BillSplitSettlement[],
    };
  };

  const { data, error, isLoading, mutate } = useSWR(groupId ? [KEY_GROUPS, groupId] : null, fetcher);

  return {
    details: data,
    isLoading,
    error,
    mutate,
  };
}

export function useCreateBillSplitGroup() {
  const { user } = useAuth();
  const { mutate } = useSWRConfig();

  return useSWRMutation(
    KEY_GROUPS,
    async (
      _,
      { arg }: { arg: { name: string; currency: string; participantNames: string[] } }
    ) => {
      if (!user?.uid) throw new Error('User not authenticated');

      const payload = {
        name: arg.name,
        currency: arg.currency,
        created_by: user.uid,
      };

      const { data: group, error: groupError } = await supabase
        .from('bill_split_groups')
        .insert(payload)
        .select('*')
        .single();

      if (groupError) throw groupError;

      const participantPayload = arg.participantNames.map((name) => ({
        group_id: group.id,
        name,
        user_id: name.toLowerCase() === 'you' ? user.uid : null,
      }));

      const { error: participantError } = await supabase
        .from('bill_split_participants')
        .insert(participantPayload);

      if (participantError) throw participantError;

      return group;
    },
    {
      onSuccess: () => mutate(KEY_GROUPS),
    }
  );
}

export function useAddBillSplitExpense(groupId: string) {
  const { mutate } = useSWRConfig();

  return useSWRMutation(
    [KEY_GROUPS, groupId],
    async (
      _,
      {
        arg,
      }: {
        arg: {
          title: string;
          amount: number;
          currency: string;
          payerParticipantId: string;
          notes?: string;
          date: string;
          splitType: 'equal' | 'custom';
          participantIds: string[];
          customShares?: Record<string, number>;
        };
      }
    ) => {
      const { data: expense, error: expenseError } = await supabase
        .from('bill_split_expenses')
        .insert({
          group_id: groupId,
          title: arg.title,
          amount: arg.amount,
          currency: arg.currency,
          payer_participant_id: arg.payerParticipantId,
          split_type: arg.splitType,
          date: arg.date,
          notes: arg.notes,
        })
        .select('*')
        .single();

      if (expenseError) throw expenseError;

      const shares =
        arg.splitType === 'custom' && arg.customShares
          ? Object.entries(arg.customShares).map(([participantId, amount]) => ({
              expense_id: expense.id,
              participant_id: participantId,
              amount,
              is_settled: participantId === arg.payerParticipantId,
            }))
          : buildEqualShares(arg.amount, arg.participantIds, arg.payerParticipantId).map((share) => ({
              ...share,
              expense_id: expense.id,
            }));

      if (!shares.length) {
        throw new Error('Please add at least one participant to split this expense.');
      }

      const { error: shareError } = await supabase.from('bill_split_shares').insert(shares);
      if (shareError) throw shareError;

      return expense;
    },
    {
      onSuccess: () => {
        mutate(KEY_GROUPS);
        mutate([KEY_GROUPS, groupId]);
      },
    }
  );
}

export function useSettleBillSplitShare(groupId: string) {
  const { mutate } = useSWRConfig();

  return useSWRMutation(
    [KEY_GROUPS, groupId, 'settle'],
    async (
      _,
      {
        arg,
      }: {
        arg: {
          shareId: string;
          expenseId: string;
          participantId: string;
          amount: number;
          method: string;
          note?: string;
        };
      }
    ) => {
      const { error: shareError } = await supabase
        .from('bill_split_shares')
        .update({ is_settled: true, settled_at: new Date().toISOString() })
        .eq('id', arg.shareId);

      if (shareError) throw shareError;

      const { error: settlementError } = await supabase.from('bill_split_settlements').insert({
        group_id: groupId,
        expense_id: arg.expenseId,
        participant_id: arg.participantId,
        amount: arg.amount,
        method: arg.method,
        note: arg.note,
      });

      if (settlementError) throw settlementError;

      return true;
    },
    {
      onSuccess: () => {
        mutate(KEY_GROUPS);
        mutate([KEY_GROUPS, groupId]);
      },
    }
  );
}
