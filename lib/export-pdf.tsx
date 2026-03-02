import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer';
import { Category, Expense } from '@/types';
import { getCurrencySymbol } from './currencies';
import { getSignedTransactionAmount, isExpenseTransaction, isIncomeTransaction } from './transactions';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 11,
    color: '#111827',
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    borderBottomStyle: 'solid',
    paddingBottom: 6,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    borderBottomStyle: 'solid',
  },
  dateCol: { width: '14%' },
  typeCol: { width: '12%' },
  categoryCol: { width: '16%' },
  merchantCol: { width: '18%' },
  noteCol: { width: '24%' },
  amountCol: { width: '16%', textAlign: 'right' },
  summary: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

const getCategoryName = (categoryId: string | undefined, categories: Category[]): string => {
  if (!categoryId) return 'Uncategorized';
  return categories.find((category) => category.id === categoryId)?.name || 'Uncategorized';
};

const safeText = (value: string | null | undefined): string => {
  if (!value || value.trim().length === 0) return '-';
  return value.trim();
};

const createFilename = (range: 'all' | 'current-month'): string => {
  const dateTag = new Date().toISOString().slice(0, 10);
  return `expenses-${range}-${dateTag}.pdf`;
};

export const exportExpensesAsPdf = async (
  expenses: Expense[],
  categories: Category[],
  range: 'all' | 'current-month'
) => {
  if (expenses.length === 0) {
    throw new Error('No expenses available to export.');
  }

  const totalIncome = expenses
    .filter((expense) => isIncomeTransaction(expense))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const totalExpense = expenses
    .filter((expense) => isExpenseTransaction(expense))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const balance = totalIncome - totalExpense;
  const generatedAt = new Date().toLocaleString();

  const report = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Transaction Export</Text>
        <Text style={styles.subtitle}>Generated {generatedAt}</Text>

        <View style={styles.tableHeader}>
          <Text style={styles.dateCol}>Date</Text>
          <Text style={styles.typeCol}>Type</Text>
          <Text style={styles.categoryCol}>Category</Text>
          <Text style={styles.merchantCol}>Merchant</Text>
          <Text style={styles.noteCol}>Notes</Text>
          <Text style={styles.amountCol}>Amount</Text>
        </View>

        {expenses.map((expense) => {
          const date = new Date(expense.date).toLocaleDateString();
          const notes = safeText(expense.notes || expense.note);
          const currency = expense.currency || 'USD';
          const signedAmount = getSignedTransactionAmount(expense);
          return (
            <View style={styles.row} key={expense.id}>
              <Text style={styles.dateCol}>{date}</Text>
              <Text style={styles.typeCol}>{signedAmount >= 0 ? 'Income' : 'Expense'}</Text>
              <Text style={styles.categoryCol}>{getCategoryName(expense.category_id, categories)}</Text>
              <Text style={styles.merchantCol}>{safeText(expense.merchant)}</Text>
              <Text style={styles.noteCol}>{notes}</Text>
              <Text style={styles.amountCol}>
                {signedAmount >= 0 ? '+' : '-'}
                {getCurrencySymbol(currency)}
                {Math.abs(expense.amount).toFixed(2)}
              </Text>
            </View>
          );
        })}

        <Text style={styles.summary}>
          Income: +{getCurrencySymbol('USD')}
          {totalIncome.toFixed(2)} | Expense: -{getCurrencySymbol('USD')}
          {totalExpense.toFixed(2)} | Balance: {balance >= 0 ? '+' : '-'}
          {getCurrencySymbol('USD')}
          {Math.abs(balance).toFixed(2)}
        </Text>
      </Page>
    </Document>
  );

  const blob = await pdf(report).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = createFilename(range);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
