import { Expense } from "@/types";
import { toSafeDate } from "@/lib/dates";

const toTimestamp = (value?: string | Date): number => {
  if (!value) return 0;
  const timestamp = toSafeDate(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const compareExpensesByRecency = (
  left: Pick<Expense, "id" | "date" | "created_at" | "updated_at">,
  right: Pick<Expense, "id" | "date" | "created_at" | "updated_at">,
): number => {
  // Strict recent ordering: newest updated first.
  const updatedDelta =
    toTimestamp(right.updated_at) - toTimestamp(left.updated_at);
  if (updatedDelta !== 0) return updatedDelta;

  // Then newest creation time.
  const createdDelta =
    toTimestamp(right.created_at) - toTimestamp(left.created_at);
  if (createdDelta !== 0) return createdDelta;

  // Then transaction date for deterministic ordering when audit timestamps tie.
  const dateDelta = toTimestamp(right.date) - toTimestamp(left.date);
  if (dateDelta !== 0) return dateDelta;

  return right.id.localeCompare(left.id);
};

export const compareExpensesByTransactionDateTime = (
  left: Pick<Expense, "id" | "date" | "created_at" | "updated_at">,
  right: Pick<Expense, "id" | "date" | "created_at" | "updated_at">,
): number => {
  // Dashboard "recent transactions" should follow transaction datetime first.
  const dateDelta = toTimestamp(right.date) - toTimestamp(left.date);
  if (dateDelta !== 0) return dateDelta;

  // Then keep audit recency semantics for deterministic same-date ordering.
  const updatedDelta =
    toTimestamp(right.updated_at) - toTimestamp(left.updated_at);
  if (updatedDelta !== 0) return updatedDelta;

  const createdDelta =
    toTimestamp(right.created_at) - toTimestamp(left.created_at);
  if (createdDelta !== 0) return createdDelta;

  return right.id.localeCompare(left.id);
};

export const sortExpensesByRecency = <
  T extends Pick<Expense, "id" | "date" | "created_at" | "updated_at">,
>(
  expenses: T[],
): T[] => {
  return [...expenses].sort(compareExpensesByRecency);
};

export const sortExpensesByTransactionDateTime = <
  T extends Pick<Expense, "id" | "date" | "created_at" | "updated_at">,
>(
  expenses: T[],
): T[] => {
  return [...expenses].sort(compareExpensesByTransactionDateTime);
};
