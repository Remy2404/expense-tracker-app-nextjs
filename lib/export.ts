import { Category, Expense } from '@/types';
import { getCurrencySymbol } from './currencies';

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

export const exportExpensesAsPdf = (expenses: Expense[], categories: Category[]) => {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const currencySymbol = getCurrencySymbol('USD');
  const rows = expenses
    .map((expense) => {
      const date = new Date(expense.date).toLocaleDateString();
      const category = getCategoryName(expense.category_id, categories);
      const notes = expense.notes || expense.note || '-';

      return `<tr>
        <td>${date}</td>
        <td>${category}</td>
        <td>${expense.merchant || '-'}</td>
        <td>${notes}</td>
        <td style="text-align:right">${getCurrencySymbol(expense.currency || 'USD')}${expense.amount.toFixed(2)}</td>
      </tr>`;
    })
    .join('');

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720');
  if (!printWindow) {
    throw new Error('Pop-up blocked. Please allow pop-ups and try again.');
  }

  printWindow.document.write(`<!doctype html>
<html>
<head>
  <title>Expense Export</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
    h1 { margin-bottom: 4px; }
    p { color: #666; margin-top: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; vertical-align: top; }
    th { background: #f6f6f6; text-align: left; }
    .summary { margin-top: 16px; font-size: 14px; font-weight: 700; }
  </style>
</head>
<body>
  <h1>Expense Export</h1>
  <p>Generated ${new Date().toLocaleString()}</p>
  <table>
    <thead>
      <tr>
        <th>Date</th><th>Category</th><th>Merchant</th><th>Notes</th><th>Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="summary">Total: ${currencySymbol}${total.toFixed(2)}</div>
</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
