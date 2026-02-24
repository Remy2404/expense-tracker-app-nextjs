import { Plus } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-foreground/60">Overview of your recent expenses and budget.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
          <Plus size={18} />
          New Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card text-card-foreground border border-border p-6 rounded-xl shadow-sm">
          <h3 className="font-medium text-foreground/60 mb-2">Total Spent (This Month)</h3>
          <p className="text-3xl font-bold">$0.00</p>
        </div>
        <div className="bg-card text-card-foreground border border-border p-6 rounded-xl shadow-sm">
          <h3 className="font-medium text-foreground/60 mb-2">Remaining Budget</h3>
          <p className="text-3xl font-bold text-success">$0.00</p>
        </div>
        <div className="bg-card text-card-foreground border border-border p-6 rounded-xl shadow-sm">
          <h3 className="font-medium text-foreground/60 mb-2">Largest Category</h3>
          <p className="text-3xl font-bold">-</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card text-card-foreground border border-border p-6 rounded-xl shadow-sm h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Recent Transactions Placeholder</p>
        </div>
        <div className="bg-card text-card-foreground border border-border p-6 rounded-xl shadow-sm h-80 flex items-center justify-center">
          <p className="text-muted-foreground">Spending Chart Placeholder</p>
        </div>
      </div>
    </div>
  );
}
