import { Category, CategoryType, Expense, TransactionType } from '@/types';

export const DEFAULT_TRANSACTION_TYPE: TransactionType = 'expense';
export const DEFAULT_CATEGORY_TYPE: CategoryType = 'expense';

export const getTransactionType = (
  transaction: Pick<Expense, 'transaction_type'>
): TransactionType => {
  return transaction.transaction_type === 'income' ? 'income' : DEFAULT_TRANSACTION_TYPE;
};

export const getCategoryType = (
  category?: Pick<Category, 'type' | 'category_type'> | null
): CategoryType => {
  if (!category) return DEFAULT_CATEGORY_TYPE;
  if (category.type === 'income' || category.category_type === 'income') return 'income';
  return DEFAULT_CATEGORY_TYPE;
};

export const isExpenseTransaction = (
  transaction: Pick<Expense, 'transaction_type'>
): boolean => {
  return getTransactionType(transaction) === 'expense';
};

export const isIncomeTransaction = (
  transaction: Pick<Expense, 'transaction_type'>
): boolean => {
  return getTransactionType(transaction) === 'income';
};

export const getSignedTransactionAmount = (
  transaction: Pick<Expense, 'amount' | 'transaction_type'>
): number => {
  return isIncomeTransaction(transaction) ? transaction.amount : -transaction.amount;
};
