'use client';

import { useState } from 'react';
import { Plus, Filter, Receipt, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useExpenses, useCategories, useDeleteExpense } from '@/hooks/useData';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { Expense } from '@/types';

export default function ExpensesPage() {
  const { expenses, isLoading } = useExpenses();
  const { categories } = useCategories();
  const { trigger: deleteExpense } = useDeleteExpense();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
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
    // Give modal time to animate out before clearing data
    setTimeout(() => setExpenseToEdit(null), 200);
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
            {expenses.map((expense) => (
              <div key={expense.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-foreground/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{expense.notes || 'Expense'}</h4>
                    <p className="text-sm text-foreground/60">{getCategoryName(expense.category_id)} • {new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right flex items-center justify-end gap-2 sm:gap-4">
                  <p className="font-semibold text-lg">${expense.amount.toFixed(2)}</p>
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
                      {deletingId === expense.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddExpenseModal 
        isOpen={isAddModalOpen} 
        onClose={handleCloseModal} 
        expenseToEdit={expenseToEdit} 
      />
    </div>
  );
}
