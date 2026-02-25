import { BillSplitExpense, BillSplitParticipant, BillSplitShare, ComputedParticipantBalance } from '@/types/billSplit';

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

export const currencyFormat = (value: number, currency = 'USD') =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
