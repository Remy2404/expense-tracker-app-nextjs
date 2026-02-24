export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-foreground/60">Deep dive into your financial habits.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-card text-card-foreground border border-border p-6 rounded-xl shadow-sm h-96 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold mb-2">Not enough data</h3>
          <p className="text-foreground/60 max-w-sm">
            Add more expenses to see trends and insights about your spending habits.
          </p>
        </div>
      </div>
    </div>
  );
}
