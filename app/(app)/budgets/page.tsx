import { Plus } from 'lucide-react';

export default function BudgetsPage() {
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
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold mb-2">No budgets set</h3>
          <p className="text-foreground/60 max-w-sm mb-6">
            Create a budget to start taking control of your financial goals.
          </p>
          <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Create Budget
          </button>
        </div>
      </div>
    </div>
  );
}
