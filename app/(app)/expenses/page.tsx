import { Plus, Filter, Receipt } from 'lucide-react';

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-foreground/60">Manage and track all your transactions.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex items-center justify-center gap-2 border border-border bg-background px-4 py-2 rounded-lg font-medium hover:bg-foreground/5 transition-colors flex-1 sm:flex-none">
            <Filter size={18} />
            Filter
          </button>
          <button className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex-1 sm:flex-none whitespace-nowrap">
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mb-4 text-foreground/40">
            <Receipt size={32} />
          </div>
          <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
          <p className="text-foreground/60 max-w-sm mb-6">
            Get started by adding your first expense to track where your money goes.
          </p>
          <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Add Expense
          </button>
        </div>
      </div>
    </div>
  );
}
