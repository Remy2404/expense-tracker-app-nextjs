import { Category, Expense } from '@/types';

const csvEscape = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const getCategoryName = (categoryId: string | undefined, categories: Category[]): string => {
  if (!categoryId) return 'Uncategorized';
  return categories.find((category) => category.id === categoryId)?.name || 'Uncategorized';
};

export const buildExpenseCsv = (expenses: Expense[], categories: Category[]): string => {
  const header = ['Date', 'Amount', 'Category', 'Merchant', 'Notes'];
  const rows = expenses.map((expense) => {
    const date = new Date(expense.date).toLocaleDateString();
    return [
      date,
      expense.amount.toFixed(2),
      getCategoryName(expense.category_id, categories),
      expense.merchant || '',
      expense.notes || expense.note || '',
    ];
  });

  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
