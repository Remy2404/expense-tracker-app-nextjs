import { Expense } from '@/types';
import { toSafeDate } from '@/lib/dates';

const toTimestamp = (value?: string | Date): number => {
  if (!value) return 0;
  const timestamp = toSafeDate(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const compareExpensesByRecency = (
  left: Pick<Expense, 'id' | 'date' | 'created_at' | 'updated_at'>,
  right: Pick<Expense, 'id' | 'date' | 'created_at' | 'updated_at'>
): number => {
  // Keep web ordering aligned with mobile:
  // created_at (newest insert first) -> updated_at -> date -> id.
  const createdDelta = toTimestamp(right.created_at) - toTimestamp(left.created_at);
  if (createdDelta !== 0) return createdDelta;

  const updatedDelta = toTimestamp(right.updated_at) - toTimestamp(left.updated_at);
  if (updatedDelta !== 0) return updatedDelta;

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
