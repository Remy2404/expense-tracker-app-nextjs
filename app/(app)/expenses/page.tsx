'use client';

import { useEffect, useMemo, useState } from 'react';
import { ReadonlyURLSearchParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, Filter, Receipt, Edit2, Trash2, Loader2, Download, FileText } from 'lucide-react';
import { useExpenses, useCategories, useDeleteExpense } from '@/hooks/useData';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { Expense } from '@/types';
import { buildExpenseCsv, downloadFile } from '@/lib/export';
import { exportExpensesAsPdf } from '@/lib/export-pdf';
import { getCurrencySymbol } from '@/lib/currencies';

type ExportRange = 'all' | 'current-month';
type ExpenseFilters = {
  query: string;
  categoryId: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
};

const EMPTY_FILTERS: ExpenseFilters = {
  query: '',
  categoryId: '',
  dateFrom: '',
  dateTo: '',
  minAmount: '',
  maxAmount: '',
};

const getFiltersFromSearchParams = (searchParams: URLSearchParams | ReadonlyURLSearchParams): ExpenseFilters => ({
  query: searchParams.get('q') || '',
  categoryId: searchParams.get('categoryId') || '',
  dateFrom: searchParams.get('dateFrom') || '',
  dateTo: searchParams.get('dateTo') || '',
  minAmount: searchParams.get('minAmount') || '',
  maxAmount: searchParams.get('maxAmount') || '',
});

const filtersEqual = (a: ExpenseFilters, b: ExpenseFilters): boolean =>
  a.query === b.query &&
  a.categoryId === b.categoryId &&
  a.dateFrom === b.dateFrom &&
  a.dateTo === b.dateTo &&
  a.minAmount === b.minAmount &&
  a.maxAmount === b.maxAmount;

export default function ExpensesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { expenses, isLoading, isError } = useExpenses();
  const { categories } = useCategories();
  const { trigger: deleteExpense } = useDeleteExpense();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportRange, setExportRange] = useState<ExportRange>('all');
  const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<ExpenseFilters>(() =>
    getFiltersFromSearchParams(new URLSearchParams(searchParams.toString()))
  );

  const currentMonth = new Date().toISOString().slice(0, 7);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      const searchSource = `${expense.notes || expense.note || ''} ${expense.merchant || ''}`.toLowerCase();
      const query = filters.query.trim().toLowerCase();

      if (query && !searchSource.includes(query)) return false;
      if (filters.categoryId && expense.category_id !== filters.categoryId) return false;

      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        if (expenseDate < from) return false;
      }

      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (expenseDate > to) return false;
      }

      if (filters.minAmount && expense.amount < Number(filters.minAmount)) return false;
      if (filters.maxAmount && expense.amount > Number(filters.maxAmount)) return false;

      return true;
    });
  }, [expenses, filters]);

  const exportableExpenses = useMemo(() => {
    if (exportRange === 'all') return filteredExpenses;
    return filteredExpenses.filter((expense) => {
      const expenseDate = typeof expense.date === 'string' ? expense.date : expense.date.toISOString();
      return expenseDate.startsWith(currentMonth);
    });
  }, [currentMonth, filteredExpenses, exportRange]);

  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  const handleEdit = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      setDeletingId(id);
      await deleteExpense({ id });
    } catch (error) {
      console.error('Failed to delete expense', error);
      alert('Failed to delete expense.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setTimeout(() => setExpenseToEdit(null), 200);
  };

  const updateFilter = (key: keyof ExpenseFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
  };

  useEffect(() => {
    const urlFilters = getFiltersFromSearchParams(searchParams);
    setFilters((prev) => (filtersEqual(prev, urlFilters) ? prev : urlFilters));
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (filters.query) params.set('q', filters.query); else params.delete('q');
    if (filters.categoryId) params.set('categoryId', filters.categoryId); else params.delete('categoryId');
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom); else params.delete('dateFrom');
    if (filters.dateTo) params.set('dateTo', filters.dateTo); else params.delete('dateTo');
    if (filters.minAmount) params.set('minAmount', filters.minAmount); else params.delete('minAmount');
    if (filters.maxAmount) params.set('maxAmount', filters.maxAmount); else params.delete('maxAmount');

    const currentQuery = searchParams.toString();
    const nextQuery = params.toString();
    if (currentQuery !== nextQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }
  }, [filters, pathname, router, searchParams]);

  const handleExportCsv = async () => {
    if (exportableExpenses.length === 0) return;
    setExportError(null);
    setIsExporting('csv');
    try {
      const csv = buildExpenseCsv(exportableExpenses, categories);
      const dateTag = new Date().toISOString().slice(0, 10);
      downloadFile(csv, `expenses-${exportRange}-${dateTag}.csv`, 'text/csv;charset=utf-8;');
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Failed to export CSV.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = async () => {
    if (exportableExpenses.length === 0) return;
    setExportError(null);
    setIsExporting('pdf');
    try {
      await exportExpensesAsPdf(exportableExpenses, categories, exportRange);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Failed to export PDF.');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col flex-wrap sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-foreground/60">Manage and track all your transactions.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <button
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="flex items-center justify-center gap-2 border border-border bg-background px-4 py-2 rounded-lg font-medium hover:bg-foreground/5 transition-colors flex-1 sm:flex-none"
          >
            <Filter size={18} />
            Filter
          </button>

          <select
            value={exportRange}
            onChange={(event) => setExportRange(event.target.value as ExportRange)}
            className="border border-border bg-background px-3 py-2 rounded-lg text-sm"
            aria-label="Export range"
          >
            <option value="all">All expenses</option>
            <option value="current-month">Current month</option>
          </select>

          <button
            onClick={handleExportCsv}
            disabled={isExporting !== null || exportableExpenses.length === 0}
            className="flex items-center justify-center gap-2 border border-border bg-background px-4 py-2 rounded-lg font-medium hover:bg-foreground/5 transition-colors disabled:opacity-50"
          >
            {isExporting === 'csv' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            CSV
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExporting !== null || exportableExpenses.length === 0}
            className="flex items-center justify-center gap-2 border border-border bg-background px-4 py-2 rounded-lg font-medium hover:bg-foreground/5 transition-colors disabled:opacity-50"
          >
            {isExporting === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            PDF
          </button>

          <button
            onClick={() => {
              setExpenseToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex-1 sm:flex-none whitespace-nowrap"
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>

      {exportError && (
        <div className="border border-red-400/40 bg-red-500/10 text-red-700 rounded-lg px-4 py-3 text-sm">
          {exportError}
        </div>
      )}

      {isFilterOpen && (
        <div className="bg-card text-card-foreground border border-border rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              type="text"
              value={filters.query}
              onChange={(event) => updateFilter('query', event.target.value)}
              placeholder="Search merchant or note"
              className="h-10 px-3 border border-border rounded-lg bg-background"
            />

            <select
              value={filters.categoryId}
              onChange={(event) => updateFilter('categoryId', event.target.value)}
              className="h-10 px-3 border border-border rounded-lg bg-background"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={filters.minAmount}
              onChange={(event) => updateFilter('minAmount', event.target.value)}
              placeholder="Min amount"
              className="h-10 px-3 border border-border rounded-lg bg-background"
            />

            <input
              type="number"
              value={filters.maxAmount}
              onChange={(event) => updateFilter('maxAmount', event.target.value)}
              placeholder="Max amount"
              className="h-10 px-3 border border-border rounded-lg bg-background"
            />

            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => updateFilter('dateFrom', event.target.value)}
              className="h-10 px-3 border border-border rounded-lg bg-background"
            />

            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => updateFilter('dateTo', event.target.value)}
              className="h-10 px-3 border border-border rounded-lg bg-background"
            />
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-foreground/60">{filteredExpenses.length} matching expenses</p>
            <button
              onClick={clearFilters}
              className="text-sm px-3 py-1.5 border border-border rounded-lg hover:bg-foreground/5"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Failed to load expenses</h3>
            <p className="text-foreground/60">Please refresh and try again.</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mb-4 text-foreground/40">
              <Receipt size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-2">No matching expenses</h3>
            <p className="text-foreground/60 max-w-sm mb-6">
              Try adjusting your filters or add a new expense.
            </p>
            <button
              onClick={() => {
                setExpenseToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Add Expense
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="p-4 sm:p-6 flex items-center justify-between hover:bg-foreground/5 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{expense.notes || 'Expense'}</h4>
                    <p className="text-sm text-foreground/60">
                      {getCategoryName(expense.category_id)} • {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center justify-end gap-2 sm:gap-4">
                  <p className="font-semibold text-lg">{getCurrencySymbol(expense.currency || 'USD')}{expense.amount.toFixed(2)}</p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="p-2 text-foreground/60 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={deletingId === expense.id}
                      className="p-2 text-foreground/60 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === expense.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddExpenseModal isOpen={isAddModalOpen} onClose={handleCloseModal} expenseToEdit={expenseToEdit} />
    </div>
  );
}
