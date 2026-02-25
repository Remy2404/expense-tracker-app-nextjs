'use client';

import { useState, useMemo } from 'react';
import { useExpenses, useCategories } from '@/hooks/useData';
import { useAiForecast, useAiInsights } from '@/hooks/useAi';
import { currencyFormat } from '@/lib/billSplit';
import { AnalyticsBarChart, AnalyticsLineChart, AnalyticsPieChart } from '@/components/charts';
import { TrendingUp, TrendingDown, Sparkles, TrendingUp as TrendUpIcon, TrendingDown as TrendDownIcon, Share2, BarChart3 } from 'lucide-react';
import { AiInsightType } from '@/types/ai';
import { useTheme } from 'next-themes';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subWeeks, subYears, differenceInDays, startOfDay, endOfDay } from 'date-fns';

type Period = 'week' | 'month' | 'year';

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const { expenses, isLoading: expensesLoading } = useExpenses();
  const { categories } = useCategories();
  const { data: forecastData, isLoading: forecastLoading } = useAiForecast();

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [insightType, setInsightType] = useState<AiInsightType>('monthly');
  const { data: insightsData, isLoading: insightsLoading } = useAiInsights(insightType);

  // Calculate date ranges based on period
  const { dateRange, previousDateRange } = useMemo(() => {
    const today = new Date();
    let start: Date, end: Date, prevStart: Date, prevEnd: Date;

    switch (selectedPeriod) {
      case 'week':
        start = startOfWeek(today);
        end = endOfWeek(today);
        prevStart = startOfWeek(subWeeks(today, 1));
        prevEnd = endOfWeek(subWeeks(today, 1));
        break;
      case 'year':
        start = startOfYear(today);
        end = endOfYear(today);
        prevStart = startOfYear(subYears(today, 1));
        prevEnd = endOfYear(subYears(today, 1));
        break;
      case 'month':
      default:
        start = startOfMonth(today);
        end = endOfMonth(today);
        prevStart = startOfMonth(subMonths(today, 1));
        prevEnd = endOfMonth(subMonths(today, 1));
    }

    return { dateRange: { start, end }, previousDateRange: { start: prevStart, end: prevEnd } };
  }, [selectedPeriod]);

  // Filter expenses for current and previous periods
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
    });
  }, [expenses, dateRange]);

  const previousExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= previousDateRange.start && expenseDate <= previousDateRange.end;
    });
  }, [expenses, previousDateRange]);

  // Calculate totals
  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  }, [filteredExpenses]);

  const previousTotal = useMemo(() => {
    return previousExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  }, [previousExpenses]);

  const percentageChange = useMemo(() => {
    if (previousTotal === 0) return 0;
    return ((totalSpent - previousTotal) / previousTotal) * 100;
  }, [totalSpent, previousTotal]);

  const averageDaily = useMemo(() => {
    const daysInPeriod = differenceInDays(dateRange.end, dateRange.start) + 1;
    return totalSpent / daysInPeriod;
  }, [totalSpent, dateRange]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const categoryTotals = new Map<string, { amount: number; color: string; name: string }>();

    filteredExpenses.forEach((expense) => {
      const catId = expense.category_id || 'uncategorized';
      const current = categoryTotals.get(catId) || { amount: 0, color: '#6366f1', name: 'Other' };
      const category = categories.find((c) => c.id === expense.category_id);

      categoryTotals.set(catId, {
        amount: current.amount + (expense.amount || 0),
        color: category?.color || current.color,
        name: category?.name || 'Other'
      });
    });

    return Array.from(categoryTotals.entries()).map(([id, data]) => ({
      name: data.name,
      amount: data.amount,
      color: data.color,
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, categories]);

  const topCategories = useMemo(() => {
    return categoryData.slice(0, 5).map((cat) => ({
      ...cat,
      percentage: totalSpent > 0 ? (cat.amount / totalSpent) * 100 : 0
    }));
  }, [categoryData, totalSpent]);

  // Bar chart data (daily for week/month, monthly for year)
  const barChartData = useMemo(() => {
    if (selectedPeriod === 'year') {
      // Monthly data for year
      const monthMap = new Map<number, number>();
      filteredExpenses.forEach((expense) => {
        const month = new Date(expense.date).getMonth();
        monthMap.set(month, (monthMap.get(month) || 0) + (expense.amount || 0));
      });
      const months = [];
      for (let i = 0; i < 12; i++) {
        months.push({
          label: format(new Date(2024, i, 1), 'MMM'),
          value: monthMap.get(i) || 0,
        });
      }
      return months;
    } else {
      // Daily data for week/month
      const days = eachDayOfInterval({
        start: dateRange.start,
        end: dateRange.end,
      });
      const dayMap = new Map<string, number>();
      filteredExpenses.forEach((expense) => {
        const dateStr = format(new Date(expense.date), 'yyyy-MM-dd');
        dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + (expense.amount || 0));
      });
      return days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return {
          label: format(day, selectedPeriod === 'month' ? 'dd' : 'EEE'),
          value: dayMap.get(dateStr) || 0,
        };
      });
    }
  }, [filteredExpenses, dateRange, selectedPeriod]);

  // Line chart data (spending trend)
  const spendingTrendData = useMemo(() => {
    if (selectedPeriod === 'week') {
      return barChartData;
    } else if (selectedPeriod === 'month') {
      // Weekly data for month
      const weeks = [];
      for (let i = 0; i < 5; i++) {
        const startIdx = i * 7;
        if (startIdx >= barChartData.length) break;
        const endIdx = Math.min(startIdx + 7, barChartData.length);
        const weekData = barChartData.slice(startIdx, endIdx);
        const weekTotal = weekData.reduce((sum, d) => sum + d.value, 0);
        weeks.push({ label: `W${i + 1}`, value: weekTotal });
      }
      return weeks;
    } else {
      return barChartData;
    }
  }, [selectedPeriod, barChartData]);

  const handleShare = async () => {
    try {
      const topCategory = topCategories.length > 0 ? topCategories[0] : null;
      const message = [
        `Financial Insights (${selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'month' ? 'This Month' : 'This Year'})`,
        `\nTotal Spent: ${currencyFormat(totalSpent)}`,
        `Trend: ${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(0)}% vs previous`,
        `Daily Average: ${currencyFormat(averageDaily)}`,
        topCategory ? `\nTop Category: ${topCategory.name} (${currencyFormat(topCategory.amount)})` : '',
        `\nGenerated by ExpenseVault`,
      ].filter(Boolean).join('\n');

      if (navigator.share) {
        await navigator.share({ title: 'Financial Insights', text: message });
      } else {
        await navigator.clipboard.writeText(message);
        alert('Insights copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const periodLabel = selectedPeriod === 'week'
    ? 'This Week'
    : selectedPeriod === 'year'
      ? 'This Year'
      : 'This Month';

  const previousLabel = selectedPeriod === 'week'
    ? 'last wk'
    : selectedPeriod === 'year'
      ? 'last yr'
      : 'last mo';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-foreground/60">Deep dive into your financial habits</p>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
        >
          <Share2 size={18} />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex bg-muted p-1 rounded-xl">
        {(['week', 'month', 'year'] as Period[]).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
              selectedPeriod === period
                ? 'bg-background text-foreground shadow-sm'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            {period === 'week' ? 'Week' : period === 'month' ? 'This Month' : 'Year'}
          </button>
        ))}
      </div>

      {/* Total Spent Card */}
      <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm opacity-80">Total Spent ({periodLabel})</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                percentageChange >= 0 ? 'bg-white/20' : 'bg-white/10'
              }`}>
                {percentageChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(percentageChange).toFixed(0)}% {previousLabel}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{currencyFormat(totalSpent)}</p>
            <p className="text-sm opacity-70 mt-1">Avg: {currencyFormat(averageDaily)}/day</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Spending by Category</h3>
          </div>
          {expensesLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <AnalyticsPieChart data={categoryData} />
          )}
        </div>

        {/* Daily/Monthly Trend */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {selectedPeriod === 'year' ? 'Monthly Trend' : 'Daily Trend'}
            </h3>
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
              Avg {currencyFormat(averageDaily)}
            </span>
          </div>
          {expensesLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <AnalyticsBarChart data={barChartData} />
          )}
        </div>

        {/* Spending Trend */}
        <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-semibold">Spending Trend</h3>
            <p className="text-sm text-foreground/60">{periodLabel} Activity</p>
          </div>
          {expensesLoading ? (
            <div className="flex items-center justify-center h-36">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <AnalyticsLineChart data={spendingTrendData} />
          )}
        </div>
      </div>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Top Spending</h3>
          <div className="space-y-4">
            {topCategories.map((cat, index) => (
              <div key={index} className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <span style={{ color: cat.color }} className="text-sm font-bold">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-medium">{cat.name}</p>
                    <p className="font-semibold">{currencyFormat(cat.amount)}</p>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Forecast & Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Forecast */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={20} className="text-primary" />
            <h3 className="font-semibold">AI Forecast</h3>
          </div>
          {forecastLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : forecastData ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-foreground/60">Estimated Month Total</p>
                <p className="text-2xl font-bold">{currencyFormat(forecastData.estimated_month_total)}</p>
                <p className={`text-sm ${forecastData.estimated_savings > 0 ? 'text-green-500' : 'text-red-500'} flex items-center gap-1 mt-1`}>
                  {forecastData.estimated_savings > 0 ? (
                    <><TrendingUp size={14} /> {currencyFormat(forecastData.estimated_savings)} projected savings</>
                  ) : (
                    <><TrendingDown size={14} /> Over budget trajectory</>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-foreground/50 text-sm">Not enough data for forecast</p>
          )}
        </div>

        {/* AI Insights */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-primary" />
              <h3 className="font-semibold">AI Insights</h3>
            </div>
            <div className="flex bg-muted p-1 rounded-lg">
              {(['daily', 'weekly', 'monthly'] as AiInsightType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setInsightType(type)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    insightType === type
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {insightsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : insightsData ? (
            <div className="space-y-3">
              <p className="text-sm">{insightsData.summary}</p>
              {insightsData.highlights?.slice(0, 3).map((highlight, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className={`p-1.5 rounded-full ${
                    highlight.direction === 'up' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                  }`}>
                    {highlight.direction === 'up' ? <TrendUpIcon size={14} /> : <TrendDownIcon size={14} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{highlight.category}</p>
                    <p className={`text-xs ${highlight.direction === 'up' ? 'text-red-500' : 'text-green-500'}`}>
                      {highlight.direction === 'up' ? '+' : '-'}{highlight.change_pct}% from average
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground/50 text-sm">Select a period to generate insights</p>
          )}
        </div>
      </div>
    </div>
  );
}
