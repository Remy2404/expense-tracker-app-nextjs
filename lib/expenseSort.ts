import { Expense } from '@/types';
import { toSafeDate } from '@/lib/dates';

const toTimestamp = (value?: string | Date): number => {
  if (!value) return 0;
  const timestamp = toSafeDate(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getActivityTimestamp = (
  expense: Pick<Expense, 'updated_at' | 'created_at' | 'date'>
): number => {
  return toTimestamp(expense.updated_at) || toTimestamp(expense.created_at) || toTimestamp(expense.date);
};

export const compareExpensesByRecency = (
  left: Pick<Expense, 'id' | 'date' | 'created_at' | 'updated_at'>,
  right: Pick<Expense, 'id' | 'date' | 'created_at' | 'updated_at'>
): number => {
  const activityDelta = getActivityTimestamp(right) - getActivityTimestamp(left);
  if (activityDelta !== 0) return activityDelta;

  const dateDelta = toTimestamp(right.date) - toTimestamp(left.date);
  if (dateDelta !== 0) return dateDelta;

  return right.id.localeCompare(left.id);
};

export const sortExpensesByRecency = <
  T extends Pick<Expense, 'id' | 'date' | 'created_at' | 'updated_at'>
>(
  expenses: T[]
): T[] => {
  return [...expenses].sort(compareExpensesByRecency);
};
