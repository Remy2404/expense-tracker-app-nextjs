'use client';

import { useEffect, useMemo, useState } from 'react';
import { ReadonlyURLSearchParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Download, Edit2, FileText, Filter, Loader2, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { useExpenses, useCategories, useDeleteExpense } from '@/hooks/useData';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { DeleteExpenseDialog } from '@/components/expenses/DeleteExpenseDialog';
import { EmptyState } from '@/components/state/EmptyState';
import { ErrorState } from '@/components/state/ErrorState';
import { PageSkeleton } from '@/components/state/PageSkeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { buildExpenseCsv, downloadFile } from '@/lib/export';
import { exportExpensesAsPdf } from '@/lib/export-pdf';
import { getCurrencySymbol } from '@/lib/currencies';
import { Expense } from '@/types';

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

const getActiveFilterCount = (filters: ExpenseFilters) =>
  Object.values(filters).filter((value) => value.trim().length > 0).length;

export default function ExpensesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { expenses, isLoading, isError, mutate } = useExpenses();
  const { categories } = useCategories();
  const { trigger: deleteExpense } = useDeleteExpense();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

  const activeFilterCount = getActiveFilterCount(filters);

  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find((item) => item.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  const handleEdit = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsAddModalOpen(true);
  };

  const handleRequestDelete = (expense: Expense) => {
    setDeleteError(null);
    setDeleteTarget(expense);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeletingId(deleteTarget.id);
      setDeleteError(null);
      await deleteExpense({ id: deleteTarget.id });
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete expense.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (open || deletingId) return;
    setDeleteError(null);
    setDeleteTarget(null);
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
    if (filters.query) params.set('q', filters.query);
    else params.delete('q');
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    else params.delete('categoryId');
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    else params.delete('dateFrom');
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    else params.delete('dateTo');
    if (filters.minAmount) params.set('minAmount', filters.minAmount);
    else params.delete('minAmount');
    if (filters.maxAmount) params.set('maxAmount', filters.maxAmount);
    else params.delete('maxAmount');

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
      <div className="flex flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Expenses</h1>
          <p className="text-muted-foreground">Manage and track all your transactions.</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button type="button" variant={isFilterOpen ? 'secondary' : 'outline'} onClick={() => setIsFilterOpen((prev) => !prev)}>
            <Filter className="mr-2 h-4 w-4" />
            Filter
            {activeFilterCount > 0 ? <Badge className="ml-2" variant="outline">{activeFilterCount}</Badge> : null}
          </Button>

          <select
            value={exportRange}
            onChange={(event) => setExportRange(event.target.value as ExportRange)}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            aria-label="Export range"
          >
            <option value="all">All expenses</option>
            <option value="current-month">Current month</option>
          </select>

          <Button type="button" variant="outline" onClick={handleExportCsv} disabled={isExporting !== null || exportableExpenses.length === 0}>
            {isExporting === 'csv' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            CSV
          </Button>

          <Button type="button" variant="outline" onClick={handleExportPdf} disabled={isExporting !== null || exportableExpenses.length === 0}>
            {isExporting === 'pdf' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            PDF
          </Button>

          <Button
            type="button"
            onClick={() => {
              setExpenseToEdit(null);
              setIsAddModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {exportError ? (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Export failed</AlertTitle>
          <AlertDescription>{exportError}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <PageSkeleton cards={2} rows={8} />
      ) : isError ? (
        <ErrorState
          title="Failed to load expenses"
          description="Please refresh and try again."
          onRetry={() => void mutate()}
        />
      ) : (
        <>
          {isFilterOpen ? (
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <input
                    type="text"
                    value={filters.query}
                    onChange={(event) => updateFilter('query', event.target.value)}
                    placeholder="Search merchant or note"
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  />

                  <select
                    value={filters.categoryId}
                    onChange={(event) => updateFilter('categoryId', event.target.value)}
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
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
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  />

                  <input
                    type="number"
                    value={filters.maxAmount}
                    onChange={(event) => updateFilter('maxAmount', event.target.value)}
                    placeholder="Max amount"
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  />

                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(event) => updateFilter('dateFrom', event.target.value)}
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  />

                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(event) => updateFilter('dateTo', event.target.value)}
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{filteredExpenses.length} matching expenses</p>
                  <Button type="button" variant="outline" size="sm" onClick={clearFilters} disabled={activeFilterCount === 0}>
                    Clear filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="overflow-hidden">
            {filteredExpenses.length === 0 ? (
              <CardContent className="p-6">
                <EmptyState
                  title={activeFilterCount > 0 ? 'No matching expenses' : 'No expenses yet'}
                  description={
                    activeFilterCount > 0
                      ? 'Try adjusting your filters to widen the result set.'
                      : 'Add your first expense to start tracking.'
                  }
                  actionLabel={activeFilterCount > 0 ? 'Clear filters' : 'Add expense'}
                  onAction={
                    activeFilterCount > 0
                      ? clearFilters
                      : () => {
                          setExpenseToEdit(null);
                          setIsAddModalOpen(true);
                        }
                  }
                />
              </CardContent>
            ) : (
              <div className="divide-y divide-border">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between gap-4 p-4 sm:p-5">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium">{expense.notes || expense.note || 'Expense'}</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{getCategoryName(expense.category_id)}</Badge>
                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-3">
                      <p className="text-right text-base font-semibold sm:text-lg">
                        {getCurrencySymbol(expense.currency || 'USD')}
                        {expense.amount.toFixed(2)}
                      </p>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleEdit(expense)} aria-label="Edit expense">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRequestDelete(expense)}
                        disabled={deletingId === expense.id}
                        aria-label="Delete expense"
                      >
                        {deletingId === expense.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      <AddExpenseModal isOpen={isAddModalOpen} onClose={handleCloseModal} expenseToEdit={expenseToEdit} />
      <DeleteExpenseDialog
        expense={deleteTarget}
        isDeleting={Boolean(deleteTarget) && deletingId === deleteTarget?.id}
        errorMessage={deleteError}
        onConfirm={handleConfirmDelete}
        onOpenChange={handleDeleteDialogOpenChange}
      />
    </div>
  );
}
