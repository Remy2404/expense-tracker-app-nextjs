import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { useSWRConfig } from 'swr';
import { useAuth } from '@/contexts/AuthContext';
import { GroupDetailsPayload, GroupSummary } from '@/types/billSplit';
import { aiHttpClient } from '@/lib/api/http';

const KEY_GROUPS = 'bill-split-groups';

export function useBillSplitGroups() {
  const { user } = useAuth();

  const fetcher = async (): Promise<GroupSummary[]> => {
    if (!user?.uid) return [];
    const response = await aiHttpClient.get('/api/bill-splits/groups');
    return response.data;
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
    const response = await aiHttpClient.get(`/api/bill-splits/groups/${groupId}`);
    return response.data;
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

      await aiHttpClient.post('/api/bill-splits/groups', {
        name: arg.name,
        currency: arg.currency,
        participantNames: arg.participantNames,
      });

      return true;
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
      await aiHttpClient.post(`/api/bill-splits/groups/${groupId}/expenses`, {
        title: arg.title,
        amount: arg.amount,
        currency: arg.currency,
        payerParticipantId: arg.payerParticipantId,
        splitType: arg.splitType,
        date: arg.date,
        notes: arg.notes,
        participantIds: arg.participantIds,
        customShares: arg.customShares,
      });

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
      await aiHttpClient.post(`/api/bill-splits/groups/${groupId}/settle`, {
        shareId: arg.shareId,
        expenseId: arg.expenseId,
        participantId: arg.participantId,
        amount: arg.amount,
        method: arg.method,
        note: arg.note,
      });

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
