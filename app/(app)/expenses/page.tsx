'use client';

import { useState } from 'react';
import { Plus, Filter, Receipt } from 'lucide-react';
import { useExpenses, useCategories } from '@/hooks/useData';
import { AddExpenseModal } from '@/components/AddExpenseModal';

export default function ExpensesPage() {
  const { expenses, isLoading } = useExpenses();
  const { categories } = useCategories();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col flex-wrap sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-foreground/60">Manage and track all your transactions.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex items-center justify-center gap-2 border border-border bg-background px-4 py-2 rounded-lg font-medium hover:bg-foreground/5 transition-colors flex-1 sm:flex-none">
            <Filter size={18} />
            Filter
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex-1 sm:flex-none whitespace-nowrap"
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mb-4 text-foreground/40">
              <Receipt size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
            <p className="text-foreground/60 max-w-sm mb-6">
              Get started by adding your first expense to track where your money goes.
            </p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Add Expense
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {expenses.map((expense) => (
              <div key={expense.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-foreground/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{expense.notes || 'Expense'}</h4>
                    <p className="text-sm text-foreground/60">{getCategoryName(expense.categoryId)} • {new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">${expense.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddExpenseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
