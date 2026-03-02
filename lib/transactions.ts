import { Category, CategoryType, Expense, TransactionType } from '@/types';

export const DEFAULT_TRANSACTION_TYPE: TransactionType = 'expense';
export const DEFAULT_CATEGORY_TYPE: CategoryType = 'expense';

type TransactionLike = Pick<Expense, 'transaction_type'> & {
  type?: string | null;
};

const normalizeTransactionTypeValue = (value: unknown): TransactionType | null => {
  if (typeof value !== 'string') return null;
  return value.toLowerCase() === 'income' ? 'income' : 'expense';
};

export const getTransactionType = (transaction: TransactionLike): TransactionType => {
  const byTransactionType = normalizeTransactionTypeValue(transaction.transaction_type);
  if (byTransactionType) return byTransactionType;

  const byLegacyType = normalizeTransactionTypeValue(transaction.type);
  if (byLegacyType) return byLegacyType;

  return DEFAULT_TRANSACTION_TYPE;
};

export const getCategoryType = (
  category?: Pick<Category, 'type' | 'category_type'> | null
): CategoryType => {
  if (!category) return DEFAULT_CATEGORY_TYPE;
  const type = typeof category.type === 'string' ? category.type.toLowerCase() : '';
  const categoryType =
    typeof category.category_type === 'string' ? category.category_type.toLowerCase() : '';
  if (type === 'income' || categoryType === 'income') return 'income';
  return DEFAULT_CATEGORY_TYPE;
};

export const isExpenseTransaction = (transaction: TransactionLike): boolean => {
  return getTransactionType(transaction) === 'expense';
};

export const isIncomeTransaction = (transaction: TransactionLike): boolean => {
  return getTransactionType(transaction) === 'income';
};

export const getSignedTransactionAmount = (
  transaction: Pick<Expense, 'amount' | 'transaction_type'> & { type?: string | null }
): number => {
  return isIncomeTransaction(transaction) ? transaction.amount : -transaction.amount;
};
