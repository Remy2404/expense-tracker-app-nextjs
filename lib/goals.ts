export type GoalTransactionType = 'deposit' | 'withdraw';

export const normalizeGoalAmount = (value: number | null | undefined): number =>
  (typeof value === 'number' && Number.isFinite(value) && value > 0) ? value : 0;

export const getGoalProgress = (
  currentAmount: number | null | undefined,
  targetAmount: number | null | undefined
): number => {
  const safeTargetAmount = normalizeGoalAmount(targetAmount);
  if (safeTargetAmount === 0) {
    return 0;
  }

  const safeCurrentAmount = normalizeGoalAmount(currentAmount);
  return Math.min((safeCurrentAmount / safeTargetAmount) * 100, 100);
};

export const getGoalRemaining = (
  currentAmount: number | null | undefined,
  targetAmount: number | null | undefined
): number => {
  const safeCurrentAmount = normalizeGoalAmount(currentAmount);
  const safeTargetAmount = normalizeGoalAmount(targetAmount);
  return Math.max(0, safeTargetAmount - safeCurrentAmount);
};

export const isGoalAchieved = (
  currentAmount: number | null | undefined,
  targetAmount: number | null | undefined
): boolean => {
  const safeTargetAmount = normalizeGoalAmount(targetAmount);
  if (safeTargetAmount === 0) {
    return false;
  }

  return normalizeGoalAmount(currentAmount) >= safeTargetAmount;
};

export const getGoalBalanceAfterTransaction = (
  currentAmount: number | null | undefined,
  amount: number,
  type: GoalTransactionType
): number => {
  const safeCurrentAmount = normalizeGoalAmount(currentAmount);
  const safeAmount = normalizeGoalAmount(amount);
  return type === 'deposit'
    ? safeCurrentAmount + safeAmount
    : Math.max(0, safeCurrentAmount - safeAmount);
};
