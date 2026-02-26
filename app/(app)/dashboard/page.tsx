'use client';

import { Plus, Sparkles, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { useExpenses, useBudgets, useCategories } from '@/hooks/useData';
import { useAiNudges } from '@/hooks/useAi';
import { useMemo, useState } from 'react';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { getCurrencySymbol } from '@/lib/currencies';
export default function DashboardPage() {
  const { expenses, isLoading: expensesLoading } = useExpenses();
  const { budgets, isLoading: budgetsLoading } = useBudgets();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data: nudgesData, isLoading: nudgesLoading } = useAiNudges();

  const isLoading = expensesLoading || budgetsLoading || categoriesLoading;

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(e => {
      const dateStr = typeof e.date === 'string' ? e.date : e.date.toISOString();
      return dateStr.startsWith(currentMonth);
    });
  }, [expenses, currentMonth]);

  const totalSpent = useMemo(() => {
    return currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [currentMonthExpenses]);

  const currentBudget = useMemo(() => {
    return budgets.find(b => b.month === currentMonth);
  }, [budgets, currentMonth]);

  const remainingBudget = useMemo(() => {
    if (!currentBudget) return 0;
    return currentBudget.total_amount - totalSpent;
  }, [currentBudget, totalSpent]);

  // Find largest category
  const largestCategoryName = useMemo(() => {
    if (currentMonthExpenses.length === 0) return '-';
    
    const categoryTotals: Record<string, number> = {};
    currentMonthExpenses.forEach(e => {
      // Safe fallback if category_id is undefined
      const catId = e.category_id || 'unknown';
      categoryTotals[catId] = (categoryTotals[catId] || 0) + e.amount;
    });

    let maxCategoryId = '';
    let maxAmount = -1;
    for (const [catId, amount] of Object.entries(categoryTotals)) {
      if (amount > maxAmount) {
        maxAmount = amount;
        maxCategoryId = catId;
      }
    }

    const category = categories.find(c => c.id === maxCategoryId);
    return category?.name || 'Unknown';
  }, [currentMonthExpenses, categories]);

  const recentTransactions = useMemo(() => {
    return [...expenses]
      .sort((a, b) => {
        const dateA = new Date(typeof a.date === 'string' ? a.date : a.date.toISOString()).getTime();
        const dateB = new Date(typeof b.date === 'string' ? b.date : b.date.toISOString()).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [expenses]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-foreground/60">Overview of your recent expenses and budget.</p>
        </div>
        <div className="flex gap-2">

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Plus size={18} />
            New Expense
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card text-card-foreground border border-border p-6 rounded-xl shadow-sm">
              <h3 className="font-medium text-foreground/60 mb-2">Total Spent (This Month)</h3>
              <p className="text-3xl font-bold">{getCurrencySymbol('USD')}{totalSpent.toFixed(2)}</p>
            </div>
            <div className="bg-card text-card-foreground border border-border p-6 rounded-xl shadow-sm">
              <h3 className="font-medium text-foreground/60 mb-2">Remaining Budget</h3>
              <p className={`text-3xl font-bold ${remainingBudget < 0 ? 'text-danger' : 'text-success'}`}>
                {getCurrencySymbol('USD')}{remainingBudget.toFixed(2)}
              </p>
            </div>
            <div className="bg-card text-card-foreground border border-border p-6 rounded-xl shadow-sm">
              <h3 className="font-medium text-foreground/60 mb-2">Largest Category</h3>
              <p className="text-3xl font-bold truncate">{largestCategoryName}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card text-card-foreground border border-border p-6 rounded-xl shadow-sm h-80 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Recent Transactions</p>
                <div className="space-y-2 text-left w-full max-w-sm">
                  {recentTransactions.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                      <span className="truncate max-w-[150px]">{exp.notes || 'Expense'}</span>
                      <span className="font-medium">{getCurrencySymbol(exp.currency || 'USD')}{exp.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {expenses.length === 0 && <p className="text-sm text-center text-foreground/50">No recent transactions</p>}
                </div>
              </div>
            </div>
            <div className="bg-card text-card-foreground border border-border p-6 rounded-xl shadow-sm h-80 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-primary" />
                <h3 className="font-medium text-foreground">AI Assistant Nudges</h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {nudgesLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : nudgesData?.nudges && nudgesData.nudges.length > 0 ? (
                  nudgesData.nudges.map((nudge) => (
                    <div key={nudge.id} className="p-3 bg-foreground/5 rounded-lg border border-border flex gap-3 items-start">
                      {nudge.severity === 'critical' ? <ShieldAlert size={18} className="text-danger flex-shrink-0 mt-0.5" /> : 
                       nudge.severity === 'warning' ? <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" /> :
                       <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />}
                      <div>
                        <h4 className="font-medium text-sm">{nudge.title}</h4>
                        <p className="text-xs text-foreground/70 mt-1">{nudge.body}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-foreground/50 text-sm">
                    <p>No new nudges right now.</p>
                    <p className="text-xs mt-1">You&apos;re doing great!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <AddExpenseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
