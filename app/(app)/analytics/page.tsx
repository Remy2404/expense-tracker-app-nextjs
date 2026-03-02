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
  endOfDay,
  format,
  eachDayOfInterval,
  isWithinInterval,
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
import { PeriodModeBadge } from '@/components/ui/period-mode-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toSafeDate } from '@/lib/dates';
import { isExpenseTransaction, isIncomeTransaction } from '@/lib/transactions';
import { Expense } from '@/types';

type Period = 'week' | 'month' | 'year';
type PeriodRange = { start: Date; end: Date };
type AnalyticsTransaction = Pick<Expense, 'amount' | 'date'>;

const buildPeriodSeries = (
  periodTransactions: AnalyticsTransaction[],
  selectedPeriod: Period,
  dateRange: PeriodRange
) => {
  if (selectedPeriod === 'year') {
    const monthMap = new Map<number, number>();
    periodTransactions.forEach((expense) => {
      const month = toSafeDate(expense.date).getMonth();
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

  periodTransactions.forEach((expense) => {
    const dateStr = format(toSafeDate(expense.date), 'yyyy-MM-dd');
    dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + (expense.amount || 0));
  });

  return days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return {
      label: format(day, selectedPeriod === 'month' ? 'dd' : 'EEE'),
      value: dayMap.get(dateStr) || 0,
    };
  });
};

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

  const filteredPeriodTransactions = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = toSafeDate(expense.date);
      return isWithinInterval(expenseDate, {
        start: dateRange.start,
        end: endOfDay(dateRange.end),
      });
    });
  }, [expenses, dateRange]);

  const filteredExpenseTransactions = useMemo(
    () => filteredPeriodTransactions.filter((expense) => isExpenseTransaction(expense)),
    [filteredPeriodTransactions]
  );

  const filteredIncomeTransactions = useMemo(
    () => filteredPeriodTransactions.filter((expense) => isIncomeTransaction(expense)),
    [filteredPeriodTransactions]
  );

  const previousExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (!isExpenseTransaction(expense)) return false;
      const expenseDate = toSafeDate(expense.date);
      return isWithinInterval(expenseDate, {
        start: previousDateRange.start,
        end: endOfDay(previousDateRange.end),
      });
    });
  }, [expenses, previousDateRange]);

  const totalSpent = useMemo(() => {
    return filteredExpenseTransactions.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  }, [filteredExpenseTransactions]);

  const totalIncome = useMemo(() => {
    return filteredIncomeTransactions.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  }, [filteredIncomeTransactions]);

  const netCashflow = useMemo(() => totalIncome - totalSpent, [totalIncome, totalSpent]);

  const previousTotal = useMemo(() => {
    return previousExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  }, [previousExpenses]);

  const percentageChange = useMemo(() => {
    if (previousTotal === 0) return 0;
    return ((totalSpent - previousTotal) / previousTotal) * 100;
  }, [totalSpent, previousTotal]);

  const daysInPeriod = useMemo(
    () => differenceInDays(dateRange.end, dateRange.start) + 1,
    [dateRange]
  );

  const averageDaily = useMemo(() => totalSpent / daysInPeriod, [totalSpent, daysInPeriod]);
  const averageIncomeDaily = useMemo(() => totalIncome / daysInPeriod, [totalIncome, daysInPeriod]);

  const categoryData = useMemo(() => {
    const categoryTotals = new Map<string, { amount: number; color: string; name: string }>();

    filteredExpenseTransactions.forEach((expense) => {
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
  }, [filteredExpenseTransactions, categories]);

  const incomeCategoryData = useMemo(() => {
    const categoryTotals = new Map<string, { amount: number; color: string; name: string }>();

    filteredIncomeTransactions.forEach((expense) => {
      const catId = expense.category_id || 'uncategorized';
      const current = categoryTotals.get(catId) || { amount: 0, color: '#22c55e', name: 'Other' };
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
  }, [filteredIncomeTransactions, categories]);

  const topCategories = useMemo(() => {
    return categoryData.slice(0, 5).map((category) => ({
      ...category,
      percentage: totalSpent > 0 ? (category.amount / totalSpent) * 100 : 0,
    }));
  }, [categoryData, totalSpent]);

  const topIncomeCategories = useMemo(() => {
    return incomeCategoryData.slice(0, 5).map((category) => ({
      ...category,
      percentage: totalIncome > 0 ? (category.amount / totalIncome) * 100 : 0,
    }));
  }, [incomeCategoryData, totalIncome]);

  const expenseBarChartData = useMemo(
    () => buildPeriodSeries(filteredExpenseTransactions, selectedPeriod, dateRange),
    [filteredExpenseTransactions, selectedPeriod, dateRange]
  );

  const incomeBarChartData = useMemo(
    () => buildPeriodSeries(filteredIncomeTransactions, selectedPeriod, dateRange),
    [filteredIncomeTransactions, selectedPeriod, dateRange]
  );

  const spendingTrendData = useMemo(() => {
    if (selectedPeriod === 'week') {
      return expenseBarChartData;
    }

    if (selectedPeriod === 'month') {
      const weeks = [];
      for (let index = 0; index < 5; index += 1) {
        const startIdx = index * 7;
        if (startIdx >= expenseBarChartData.length) break;
        const endIdx = Math.min(startIdx + 7, expenseBarChartData.length);
        const weekData = expenseBarChartData.slice(startIdx, endIdx);
        const weekTotal = weekData.reduce((sum, item) => sum + item.value, 0);
        weeks.push({ label: `W${index + 1}`, value: weekTotal });
      }
      return weeks;
    }

    return expenseBarChartData;
  }, [selectedPeriod, expenseBarChartData]);

  const incomeTrendData = useMemo(() => {
    if (selectedPeriod === 'week') {
      return incomeBarChartData;
    }

    if (selectedPeriod === 'month') {
      const weeks = [];
      for (let index = 0; index < 5; index += 1) {
        const startIdx = index * 7;
        if (startIdx >= incomeBarChartData.length) break;
        const endIdx = Math.min(startIdx + 7, incomeBarChartData.length);
        const weekData = incomeBarChartData.slice(startIdx, endIdx);
        const weekTotal = weekData.reduce((sum, item) => sum + item.value, 0);
        weeks.push({ label: `W${index + 1}`, value: weekTotal });
      }
      return weeks;
    }

    return incomeBarChartData;
  }, [selectedPeriod, incomeBarChartData]);

  const hasExpenseData = filteredExpenseTransactions.length > 0;
  const hasIncomeData = filteredIncomeTransactions.length > 0;
  const hasPeriodActivity = filteredPeriodTransactions.length > 0;
  const usesIncomeFallback = !hasExpenseData && hasIncomeData;

  const categoryChartTitle = usesIncomeFallback ? 'Income by Category' : 'Spending by Category';
  const categoryChartData = usesIncomeFallback ? incomeCategoryData : categoryData;
  const trendChartTitle = usesIncomeFallback
    ? selectedPeriod === 'year'
      ? 'Monthly Income Trend'
      : 'Daily Income Trend'
    : selectedPeriod === 'year'
      ? 'Monthly Trend'
      : 'Daily Trend';
  const trendChartData = usesIncomeFallback ? incomeBarChartData : expenseBarChartData;
  const trendLineTitle = usesIncomeFallback ? 'Income Trend' : 'Spending Trend';
  const trendLineData = usesIncomeFallback ? incomeTrendData : spendingTrendData;
  const topCategoryTitle = usesIncomeFallback ? 'Top Income' : 'Top Spending';
  const topCategoryRows = usesIncomeFallback ? topIncomeCategories : topCategories;
  const topCategoryShareLabel = usesIncomeFallback ? 'Top Income Category' : 'Top Spending Category';
  const displayedDailyAverage = usesIncomeFallback ? averageIncomeDaily : averageDaily;

  const handleShare = async () => {
    try {
      const topCategory = topCategoryRows.length > 0 ? topCategoryRows[0] : null;
      const message = [
        `Financial Insights (${selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'month' ? 'This Month' : 'This Year'})`,
        `Total Income: ${currencyFormat(totalIncome)}`,
        `\nTotal Spent: ${currencyFormat(totalSpent)}`,
        `Net Cashflow: ${currencyFormat(netCashflow)}`,
        `Transactions: ${filteredPeriodTransactions.length}`,
        `Trend: ${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(0)}% vs previous`,
        `Daily Average: ${currencyFormat(displayedDailyAverage)}`,
        topCategory
          ? `\n${topCategoryShareLabel}: ${topCategory.name} (${currencyFormat(topCategory.amount)})`
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

  const periodMode = selectedPeriod === 'year' ? 'all-time' : 'this-month';
  const periodDetail =
    selectedPeriod === 'week' ? 'Week view' : selectedPeriod === 'year' ? 'Year view' : 'Month view';

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

      <div className="flex items-center justify-end">
        <PeriodModeBadge mode={periodMode} detail={periodDetail} />
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

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Income</p>
              <p className="text-lg font-semibold text-emerald-600">{currencyFormat(totalIncome)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Expense</p>
              <p className="text-lg font-semibold text-destructive">{currencyFormat(totalSpent)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Net</p>
              <p className={`text-lg font-semibold ${netCashflow >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {currencyFormat(netCashflow)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Transactions</p>
              <p className="text-lg font-semibold">{filteredPeriodTransactions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{categoryChartTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryChartData.length === 0 ? (
              <EmptyState
                title={hasPeriodActivity ? 'No category split' : 'No category data'}
                description={
                  hasPeriodActivity
                    ? 'Transactions exist, but category assignments are missing in this period.'
                    : 'Add transactions in this period to see category insights.'
                }
              />
            ) : (
              <AnalyticsPieChart data={categoryChartData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{trendChartTitle}</CardTitle>
            <Badge variant="outline">Avg {currencyFormat(displayedDailyAverage)}</Badge>
          </CardHeader>
          <CardContent>
            {trendChartData.every((item) => item.value === 0) ? (
              <EmptyState
                title="No trend data"
                description="Track more transactions to see trends in this period."
              />
            ) : (
              <AnalyticsBarChart data={trendChartData} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{trendLineTitle}</CardTitle>
            <CardDescription>{periodLabel} activity</CardDescription>
          </CardHeader>
          <CardContent>
            {trendLineData.every((item) => item.value === 0) ? (
              <EmptyState
                title="No period trend"
                description="You have no transactions recorded for this period yet."
              />
            ) : (
              <AnalyticsLineChart data={trendLineData} />
            )}
          </CardContent>
        </Card>
      </div>

      {topCategoryRows.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{topCategoryTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCategoryRows.map((category, index) => (
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
