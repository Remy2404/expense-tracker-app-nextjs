import {
  BillSplitExpense,
  BillSplitParticipant,
  BillSplitShare,
  ComputedParticipantBalance,
  GroupSummary,
} from '@/types/billSplit';

type BillSplitRecord = Record<string, unknown>;

const asRecord = (value: unknown): BillSplitRecord =>
  value && typeof value === 'object' ? (value as BillSplitRecord) : {};

export const toFiniteNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const normalizeGroupSummary = (value: unknown): GroupSummary => {
  const record = asRecord(value);

  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? 'Untitled Group'),
    currency: String(record.currency ?? 'USD'),
    created_by: String(record.created_by ?? record.createdBy ?? ''),
    created_at: String(record.created_at ?? record.createdAt ?? ''),
    updated_at:
      typeof record.updated_at === 'string'
        ? record.updated_at
        : typeof record.updatedAt === 'string'
          ? record.updatedAt
          : undefined,
    is_deleted:
      typeof record.is_deleted === 'boolean'
        ? record.is_deleted
        : typeof record.isDeleted === 'boolean'
          ? record.isDeleted
          : false,
    participantsCount: toFiniteNumber(record.participantsCount ?? record.participants_count),
    expensesCount: toFiniteNumber(record.expensesCount ?? record.expenses_count),
    unsettledSharesCount: toFiniteNumber(
      record.unsettledSharesCount ?? record.unsettled_shares_count
    ),
    totalExpenses: toFiniteNumber(record.totalExpenses ?? record.total_expenses),
  };
};

export const buildEqualShares = (
  amount: number,
  participantIds: string[],
  payerId: string
): Array<{ participant_id: string; amount: number; is_settled: boolean }> => {
  if (!participantIds.length) return [];

  const perHead = Number((amount / participantIds.length).toFixed(2));
  const shares = participantIds.map((participantId) => ({
    participant_id: participantId,
    amount: perHead,
    is_settled: participantId === payerId,
  }));

  const splitSum = shares.reduce((sum, share) => sum + share.amount, 0);
  const remainder = Number((amount - splitSum).toFixed(2));

  if (remainder !== 0) {
    shares[0].amount = Number((shares[0].amount + remainder).toFixed(2));
  }

  return shares;
};

export const computeParticipantBalances = (
  participants: BillSplitParticipant[],
  expenses: BillSplitExpense[],
  shares: BillSplitShare[]
): ComputedParticipantBalance[] => {
  const balanceMap = new Map<string, number>();

  participants.forEach((participant) => balanceMap.set(participant.id, 0));

  expenses.forEach((expense) => {
    balanceMap.set(
      expense.payer_participant_id,
      (balanceMap.get(expense.payer_participant_id) ?? 0) + Number(expense.amount)
    );

    const expenseShares = shares.filter((share) => share.expense_id === expense.id);
    expenseShares.forEach((share) => {
      balanceMap.set(share.participant_id, (balanceMap.get(share.participant_id) ?? 0) - Number(share.amount));
      if (share.is_settled) {
        balanceMap.set(share.participant_id, (balanceMap.get(share.participant_id) ?? 0) + Number(share.amount));
        balanceMap.set(
          expense.payer_participant_id,
          (balanceMap.get(expense.payer_participant_id) ?? 0) - Number(share.amount)
        );
      }
    });
  });

  return participants.map((participant) => ({
    participantId: participant.id,
    participantName: participant.name,
    balance: Number((balanceMap.get(participant.id) ?? 0).toFixed(2)),
  }));
};

export const currencyFormat = (value: number | string | null | undefined, currency = 'USD') =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(toFiniteNumber(value));
