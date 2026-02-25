import { useMemo } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { currencyFormat } from '@/lib/billSplit';
import { useTheme } from 'next-themes';

interface LineChartProps {
  data: { label: string; value: number }[];
  currency?: string;
}

export function AnalyticsLineChart({ data, currency = 'USD' }: LineChartProps) {
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  const colors = useMemo(() => ({
    stroke: isDark ? '#818cf8' : '#6366f1',
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#9ca3af' : '#6b7280',
    tooltipBg: isDark ? '#1f2937' : '#ffffff',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
  }), [isDark]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-foreground/50 text-sm">
        No data available
      </div>
    );
  }

  // Limit labels to prevent overcrowding
  const displayData = data.map((item, index) => {
    const showLabel = data.length <= 7 || index === 0 || index === data.length - 1 || index % Math.ceil(data.length / 6) === 0;
    return {
      ...item,
      label: showLabel ? item.label : '',
    };
  });

  return (
    <ResponsiveContainer width="100%" height={150}>
      <RechartsLineChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: colors.text }}
          axisLine={{ stroke: colors.grid }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: colors.text }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: colors.tooltipBg,
            border: `1px solid ${colors.tooltipBorder}`,
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          labelStyle={{ color: colors.text, marginBottom: 4 }}
          formatter={(value) => [currencyFormat(Number(value) || 0, currency), 'Amount']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={colors.stroke}
          strokeWidth={2}
          dot={displayData.length <= 10}
          activeDot={{ r: 4, fill: colors.stroke }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
