'use client';

import { useMemo, useState } from 'react';
import { useExpenses, useCategories } from '@/hooks/useData';
import { useAiForecast, useAiInsights } from '@/hooks/useAi';
import { currencyFormat } from '@/lib/billSplit';
import { AnalyticsBarChart, AnalyticsLineChart, AnalyticsPieChart } from '@/components/charts';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  Share2,
  BarChart3,
} from 'lucide-react';
import { AiInsightType } from '@/types/ai';
import {
  format,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subWeeks,
  subYears,
  differenceInDays,
} from 'date-fns';
import { EmptyState } from '@/components/state/EmptyState';
import { ErrorState } from '@/components/state/ErrorState';
import { PageSkeleton } from '@/components/state/PageSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Period = 'week' | 'month' | 'year';

export default function AnalyticsPage() {
  const { expenses, isLoading: expensesLoading, isError: expensesError } = useExpenses();
  const { categories } = useCategories();
  const { data: forecastData, isLoading: forecastLoading, error: forecastError } = useAiForecast();

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [insightType, setInsightType] = useState<AiInsightType>('monthly');
  const {
    data: insightsData,
    isLoading: insightsLoading,
    error: insightsError,
  } = useAiInsights(insightType);

  const { dateRange, previousDateRange } = useMemo(() => {
    const today = new Date();
    let start: Date;
    let end: Date;
    let prevStart: Date;
    let prevEnd: Date;

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

  const categoryData = useMemo(() => {
    const categoryTotals = new Map<string, { amount: number; color: string; name: string }>();

    filteredExpenses.forEach((expense) => {
      const catId = expense.category_id || 'uncategorized';
      const current = categoryTotals.get(catId) || { amount: 0, color: '#6366f1', name: 'Other' };
      const category = categories.find((item) => item.id === expense.category_id);

      categoryTotals.set(catId, {
        amount: current.amount + (expense.amount || 0),
        color: category?.color || current.color,
        name: category?.name || 'Other',
      });
    });

    return Array.from(categoryTotals.entries())
      .map(([, data]) => ({
        name: data.name,
        amount: data.amount,
        color: data.color,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, categories]);

  const topCategories = useMemo(() => {
    return categoryData.slice(0, 5).map((category) => ({
      ...category,
      percentage: totalSpent > 0 ? (category.amount / totalSpent) * 100 : 0,
    }));
  }, [categoryData, totalSpent]);

  const barChartData = useMemo(() => {
    if (selectedPeriod === 'year') {
      const monthMap = new Map<number, number>();
      filteredExpenses.forEach((expense) => {
        const month = new Date(expense.date).getMonth();
        monthMap.set(month, (monthMap.get(month) || 0) + (expense.amount || 0));
      });

      const months = [];
      for (let index = 0; index < 12; index += 1) {
        months.push({
          label: format(new Date(2024, index, 1), 'MMM'),
          value: monthMap.get(index) || 0,
        });
      }
      return months;
    }

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
  }, [filteredExpenses, dateRange, selectedPeriod]);

  const spendingTrendData = useMemo(() => {
    if (selectedPeriod === 'week') {
      return barChartData;
    }

    if (selectedPeriod === 'month') {
      const weeks = [];
      for (let index = 0; index < 5; index += 1) {
        const startIdx = index * 7;
        if (startIdx >= barChartData.length) break;
        const endIdx = Math.min(startIdx + 7, barChartData.length);
        const weekData = barChartData.slice(startIdx, endIdx);
        const weekTotal = weekData.reduce((sum, item) => sum + item.value, 0);
        weeks.push({ label: `W${index + 1}`, value: weekTotal });
      }
      return weeks;
    }

    return barChartData;
  }, [selectedPeriod, barChartData]);

  const handleShare = async () => {
    try {
      const topCategory = topCategories.length > 0 ? topCategories[0] : null;
      const message = [
        `Financial Insights (${selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'month' ? 'This Month' : 'This Year'})`,
        `\nTotal Spent: ${currencyFormat(totalSpent)}`,
        `Trend: ${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(0)}% vs previous`,
        `Daily Average: ${currencyFormat(averageDaily)}`,
        topCategory
          ? `\nTop Category: ${topCategory.name} (${currencyFormat(topCategory.amount)})`
          : '',
        '\nGenerated by ExpenseVault',
      ]
        .filter(Boolean)
        .join('\n');

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

  const periodLabel =
    selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'year' ? 'This Year' : 'This Month';

  const previousLabel =
    selectedPeriod === 'week' ? 'last wk' : selectedPeriod === 'year' ? 'last yr' : 'last mo';

  if (expensesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-foreground/60">Deep dive into your financial habits</p>
          </div>
        </div>
        <PageSkeleton cards={3} rows={8} />
      </div>
    );
  }

  if (expensesError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-foreground/60">Deep dive into your financial habits</p>
        </div>
        <ErrorState
          title="Failed to load analytics data"
          description="Please refresh and try again."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-foreground/60">Deep dive into your financial habits</p>
        </div>
        <Button onClick={handleShare} variant="outline" className="gap-2">
          <Share2 size={18} />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </div>

      <div className="flex bg-muted p-1 rounded-xl" role="radiogroup" aria-label="Analytics period">
        {(['week', 'month', 'year'] as Period[]).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            role="radio"
            aria-checked={selectedPeriod === period}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              selectedPeriod === period
                ? 'bg-background text-foreground shadow-sm'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            {period === 'week' ? 'Week' : period === 'month' ? 'This Month' : 'Year'}
          </button>
        ))}
      </div>

      <Card className="bg-primary text-primary-foreground border-primary/20 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4 gap-4">
            <div>
              <p className="text-sm opacity-80">Total Spent ({periodLabel})</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className="text-primary-foreground bg-white/15 hover:bg-white/15 rounded-full"
                >
                  {percentageChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(percentageChange).toFixed(0)}% {previousLabel}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl sm:text-4xl font-bold">{currencyFormat(totalSpent)}</p>
              <p className="text-sm opacity-80 mt-1">Avg: {currencyFormat(averageDaily)}/day</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <EmptyState
                title="No category data"
                description="Add expenses in this period to see category insights."
              />
            ) : (
              <AnalyticsPieChart data={categoryData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {selectedPeriod === 'year' ? 'Monthly Trend' : 'Daily Trend'}
            </CardTitle>
            <Badge variant="outline">Avg {currencyFormat(averageDaily)}</Badge>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <EmptyState
                title="No trend data"
                description="Track more expenses to see trends in this period."
              />
            ) : (
              <AnalyticsBarChart data={barChartData} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spending Trend</CardTitle>
            <CardDescription>{periodLabel} activity</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <EmptyState
                title="No spending trend"
                description="You have no expenses recorded for this period yet."
              />
            ) : (
              <AnalyticsLineChart data={spendingTrendData} />
            )}
          </CardContent>
        </Card>
      </div>

      {topCategories.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Spending</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCategories.map((category, index) => (
              <div key={`${category.name}-${index}`} className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <span style={{ color: category.color }} className="text-sm font-bold">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-medium">{category.name}</p>
                    <p className="font-semibold">{currencyFormat(category.amount)}</p>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${category.percentage}%`, backgroundColor: category.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              AI Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            {forecastLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : forecastError ? (
              <ErrorState
                title="Forecast unavailable"
                description="Try again in a moment."
              />
            ) : forecastData ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Month Total</p>
                  <p className="text-2xl font-bold">
                    {currencyFormat(forecastData.estimated_month_total)}
                  </p>
                </div>
                <p
                  className={`text-sm flex items-center gap-1 ${
                    forecastData.estimated_savings > 0 ? 'text-green-600' : 'text-destructive'
                  }`}
                >
                  {forecastData.estimated_savings > 0 ? (
                    <>
                      <TrendingUp size={14} />
                      {currencyFormat(forecastData.estimated_savings)} projected savings
                    </>
                  ) : (
                    <>
                      <TrendingDown size={14} />
                      Over budget trajectory
                    </>
                  )}
                </p>
              </div>
            ) : (
              <EmptyState
                title="No forecast yet"
                description="Not enough data to generate a forecast."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                AI Insights
              </CardTitle>
              <div className="flex bg-muted p-1 rounded-lg" role="radiogroup" aria-label="Insight period">
                {(['daily', 'weekly', 'monthly'] as AiInsightType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setInsightType(type)}
                    role="radio"
                    aria-checked={insightType === type}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-10/12" />
              </div>
            ) : insightsError ? (
              <ErrorState title="Insights unavailable" description="Try again in a moment." />
            ) : insightsData ? (
              <div className="space-y-3">
                <p className="text-sm">{insightsData.summary}</p>
                {insightsData.highlights?.slice(0, 3).map((highlight, index) => (
                  <div key={`${highlight.category}-${index}`} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div
                      className={`p-1.5 rounded-full ${
                        highlight.direction === 'up'
                          ? 'bg-red-500/10 text-red-600'
                          : 'bg-green-500/10 text-green-600'
                      }`}
                    >
                      {highlight.direction === 'up' ? (
                        <TrendUpIcon size={14} />
                      ) : (
                        <TrendDownIcon size={14} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{highlight.category}</p>
                      <p
                        className={`text-xs ${
                          highlight.direction === 'up' ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {highlight.direction === 'up' ? '+' : '-'}
                        {highlight.change_pct}% from average
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No insights yet"
                description="Select another period after adding more transactions."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
