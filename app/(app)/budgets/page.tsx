'use client';

import { Plus, Target } from 'lucide-react';
import { useBudgets } from '@/hooks/useData';

export default function BudgetsPage() {
  const { budgets, isLoading } = useBudgets();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-foreground/60">Set limits and monitor your spending goals.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
          <Plus size={18} />
          Create Budget
        </button>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : budgets.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mb-4 text-foreground/40">
              <Target size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-2">No budgets set</h3>
            <p className="text-foreground/60 max-w-sm mb-6">
              Create a budget to start taking control of your financial goals.
            </p>
            <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity">
              Create Budget
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {budgets.map((budget) => (
              <div key={budget.id} className="p-4 sm:p-6 hover:bg-foreground/5 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-lg">{budget.month}</h4>
                  <span className="font-medium">Limit: ${budget.totalAmount.toFixed(2)}</span>
                </div>
                {/* Visual indicator (Progress bar) could be added here later */}
                <div className="w-full bg-border rounded-full h-2.5 mt-4">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: '0%' }}></div> {/* To be wired up with actual spent data */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
